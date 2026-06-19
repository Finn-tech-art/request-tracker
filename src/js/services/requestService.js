import Request from "../models/requestModel.js";
import { generateRequestId } from "../utils/helper.js";

const cache = [];
let useSupabase = false;
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;
const bc = (typeof window !== 'undefined' && 'BroadcastChannel' in window) ? new BroadcastChannel('request-tracker') : null;

function broadcast(detail) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        try {
            window.dispatchEvent(new CustomEvent('request-updated', { detail }));
        } catch (e) {
            // ignore
        }
    }
    // send to other tabs/windows via BroadcastChannel (avoid echoing messages received from bc)
    try {
        if (bc && (!detail || detail.source !== 'bc')) {
            bc.postMessage(detail || { type: 'ping' });
        }
    } catch (e) {
        // ignore
    }
}

function dbToJs(row) {
    if (!row) return null;
    return new Request({
        id: row.id,
        name: row.name,
        email: row.email,
        product: row.product,
        requestType: row.request_type,
        priority: row.priority || '',
        message: row.message,
        status: row.status || 'Open',
        createdAt: row.created_at || new Date().toISOString()
    });
}

function jsToDb(obj) {
    const out = {};
    if (obj.name !== undefined) out.name = obj.name;
    if (obj.email !== undefined) out.email = obj.email;
    if (obj.product !== undefined) out.product = obj.product;
    if (obj.requestType !== undefined) out.request_type = obj.requestType;
    if (obj.priority !== undefined) out.priority = obj.priority;
    if (obj.message !== undefined) out.message = obj.message;
    if (obj.status !== undefined) out.status = obj.status;
    if (obj.createdAt !== undefined) out.created_at = obj.createdAt;
    return out;
}

function supabaseHeaders() {
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

async function fetchFromSupabase() {
    const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/requests?select=*&order=created_at.desc`;
    const res = await fetch(endpoint, { headers: supabaseHeaders() });
    if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
    const rows = await res.json();
    return rows.map(dbToJs);
}

class RequestService {
    // initialize must be called after runtime config is available
    async init(config = {}) {
        SUPABASE_URL = config.SUPABASE_URL || null;
        SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || null;
        useSupabase = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
        if (!useSupabase) {
            throw new Error('Supabase configuration missing. SUPABASE_URL and SUPABASE_ANON_KEY are required.');
        }

        try {
            const rows = await fetchFromSupabase();
            cache.length = 0;
            cache.push(...rows);
            broadcast({ type: 'loaded', items: cache.slice() });
        } catch (e) {
            console.error('Failed to load requests from Supabase', e);
            throw e;
        }

        // Setup BroadcastChannel listener to refresh cache when other tabs signal updates
        if (bc) {
            bc.onmessage = async (ev) => {
                const data = ev && ev.data ? ev.data : null;
                // avoid reacting to our own messages (we tag source when rebroadcasting)
                try {
                    const rows = await fetchFromSupabase();
                    cache.length = 0;
                    cache.push(...rows);
                    broadcast(Object.assign({ type: 'synced' , source: 'bc' }, data || {}));
                } catch (err) {
                    console.error('Failed to refresh requests from Supabase on BroadcastChannel message', err);
                }
            };
        }

        // No localStorage fallback — rely on BroadcastChannel and Supabase for sync
    }

    async create(data) {
        if (!useSupabase) throw new Error('RequestService not initialized with Supabase.');

        const request = new Request({
            id: generateRequestId(),
            ...data,
            status: 'Open',
            createdAt: new Date().toISOString()
        });

        const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/requests`;
        const body = jsToDb(request);
        if (request.id) body.id = request.id;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: supabaseHeaders(),
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Supabase create failed: ${res.status} ${txt}`);
        }

        const created = await res.json();
        const row = Array.isArray(created) && created.length > 0 ? dbToJs(created[0]) : dbToJs(created);
        cache.push(row);
        broadcast({ type: 'create', item: row });
        return row;
    }

    getAll() {
        return cache.slice();
    }

    getById(id) {
        return cache.find(r => r.id === id) || null;
    }

    async update(id, changes) {
        const idx = cache.findIndex(r => r.id === id);
        if (idx === -1) return null;
        const updated = { ...cache[idx], ...changes };
        cache[idx] = updated;
        broadcast({ type: 'update', item: updated });

        if (!useSupabase) throw new Error('RequestService not initialized with Supabase.');

        const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/requests?id=eq.${encodeURIComponent(id)}`;
        const body = jsToDb(changes);
        const res = await fetch(endpoint, {
            method: 'PATCH',
            headers: supabaseHeaders(),
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Supabase update failed: ${res.status} ${txt}`);
        }

        const updatedRows = await res.json();
        const row = Array.isArray(updatedRows) && updatedRows.length > 0 ? dbToJs(updatedRows[0]) : dbToJs(updatedRows);
        const i = cache.findIndex(r => r.id === id || r.id === row.id);
        if (i !== -1) cache[i] = row; else cache.push(row);
        broadcast({ type: 'update', item: row });
        return row;
    }
}

export default new RequestService();