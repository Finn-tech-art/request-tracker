import Request from "../models/requestModel.js";
import { generateRequestId } from "../utils/helper.js";
import authService from "./authService.js";

const cache = [];
let API_BASE = null;
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

function authHeaders() {
    const token = authService.getToken();
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

async function fetchFromServer() {
    const endpoint = `${API_BASE.replace(/\/$/, '')}/api/requests`;
    const res = await fetch(endpoint, { headers: authHeaders() });
    if (!res.ok) throw new Error(`API fetch failed: ${res.status}`);
    const rows = await res.json();
    return rows.map(dbToJs);
}

class RequestService {
    // initialize must be called after runtime config is available
    async init(config = {}) {
        API_BASE = config.AUTH_API_URL || null;
        if (!API_BASE) {
            throw new Error('API base URL missing. AUTH_API_URL is required in config.');
        }

        try {
            const rows = await fetchFromServer();
            cache.length = 0;
            cache.push(...rows);
            broadcast({ type: 'loaded', items: cache.slice() });
        } catch (e) {
            console.error('Failed to load requests from API', e);
            throw e;
        }

        // Setup BroadcastChannel listener to refresh cache when other tabs signal updates
        if (bc) {
            bc.onmessage = async (ev) => {
                const data = ev && ev.data ? ev.data : null;
                // avoid reacting to our own messages (we tag source when rebroadcasting)
                try {
                    const rows = await fetchFromServer();
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
        if (!API_BASE) throw new Error('RequestService not initialized with API base URL.');

        const request = new Request({
            id: generateRequestId(),
            ...data,
            status: 'Open',
            createdAt: new Date().toISOString()
        });

        const endpoint = `${API_BASE.replace(/\/$/, '')}/api/requests`;
        const body = jsToDb(request);

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`API create failed: ${res.status} ${txt}`);
        }

        const created = await res.json();
        const row = dbToJs(created);
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

        if (!API_BASE) throw new Error('RequestService not initialized with API base URL.');

        const endpoint = `${API_BASE.replace(/\/$/, '')}/api/requests/${encodeURIComponent(id)}`;
        const body = jsToDb(changes);
        const res = await fetch(endpoint, {
            method: 'PATCH',
            headers: authHeaders(),
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
