
import { initializeSubmitPage } from "./controllers/submitController.js";
import { initializeRequestPage } from "./controllers/requestController.js";
import { initializeDashboardPage } from "./controllers/dashboardController.js";
import { initializeAuthPage } from "./controllers/authController.js";
import authService from "./services/authService.js";
import requestService from "./services/requestService.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Attempt to load build-time config module (generated during static site build).
    try {
        const cfgModule = await import('./config/config.js');
        if (cfgModule && cfgModule.default) {
            window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, cfgModule.default);
        }
    } catch (e) {
        // no build-time config present — continue to other fallback methods
    }

    // Helper: read meta tags for quick config injection
    function readMeta(name) {
        try {
            const m = document.querySelector(`meta[name="${name}"]`);
            return m ? m.getAttribute('content') : null;
        } catch (e) {
            return null;
        }
    }

    // Try meta tags (supabase-url, supabase-anon-key, auth-api-url)
    const metaSupabaseUrl = readMeta('supabase-url');
    const metaSupabaseKey = readMeta('supabase-anon-key');
    const metaAuthUrl = readMeta('auth-api-url');
    if (metaSupabaseUrl && metaSupabaseKey) {
        window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, {
            SUPABASE_URL: metaSupabaseUrl,
            SUPABASE_ANON_KEY: metaSupabaseKey
        });
    }
    if (metaAuthUrl) {
        window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, { AUTH_API_URL: metaAuthUrl.replace(/\/$/, '') });
    }

    // Try URL query params as a convenience for quick testing: ?supabase_url=...&supabase_key=...
    try {
        const params = new URLSearchParams(window.location.search || '');
        const qSupabaseUrl = params.get('supabase_url') || params.get('supabase-url');
        const qSupabaseKey = params.get('supabase_key') || params.get('supabase-anon-key') || params.get('supabase-key');
        const qAuth = params.get('auth_api_url') || params.get('auth-api-url');
        if (qSupabaseUrl && qSupabaseKey) {
            window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, {
                SUPABASE_URL: qSupabaseUrl,
                SUPABASE_ANON_KEY: qSupabaseKey
            });
        }
        if (qAuth) window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, { AUTH_API_URL: qAuth.replace(/\/$/, '') });
    } catch (e) {
        // ignore
    }

    // Only fetch runtime /config from an auth server if we don't already have Supabase config
    const hasSupabase = !!(window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL && window.APP_CONFIG.SUPABASE_ANON_KEY);
    const configuredAuth = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.AUTH_API_URL) ? window.APP_CONFIG.AUTH_API_URL.replace(/\/$/, '') : null;
    const isLocalhost = (typeof window !== 'undefined' && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'));
    const authBase = configuredAuth || (isLocalhost ? 'http://127.0.0.1:8000' : null);

    if (!hasSupabase && authBase) {
        try {
            const res = await fetch(`${authBase}/config`);
            if (res.ok) {
                const cfg = await res.json();
                window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, {
                    AUTH_API_URL: cfg.AUTH_API_URL || authBase,
                    SUPABASE_URL: cfg.SUPABASE_URL,
                    SUPABASE_ANON_KEY: cfg.SUPABASE_ANON_KEY
                });
            } else {
                console.warn('Failed to load config from auth server:', res.status);
            }
        } catch (e) {
            console.warn('Could not reach auth server for config:', e);
        }
    }

    // Non-blocking UI warning when the data backend is not configured.
    function showBackendWarning() {
        try {
            if (document.getElementById('rt-backend-warning')) return;
            const div = document.createElement('div');
            div.id = 'rt-backend-warning';
            div.style = 'position:fixed;bottom:12px;right:12px;background:#fff4e5;color:#333;padding:8px 12px;border:1px solid #ffd18a;border-radius:8px;z-index:9999;font-size:13px;box-shadow:0 6px 18px rgba(0,0,0,.12)';
            div.innerHTML = 'Data backend not configured. Set Supabase config (SUPABASE_URL & SUPABASE_ANON_KEY) or provide an auth service. <button id="rt-warn-hide" style="margin-left:8px">Dismiss</button>';
            document.body.appendChild(div);
            document.getElementById('rt-warn-hide').addEventListener('click', () => div.remove());
        } catch (e) { /* ignore DOM errors */ }
    }

    // Initialize the request service only if we have Supabase config. Otherwise, warn but don't block the UI.
    const finalHasSupabase = !!(window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL && window.APP_CONFIG.SUPABASE_ANON_KEY);
    if (finalHasSupabase) {
        try {
            await requestService.init(window.APP_CONFIG || {});
        } catch (e) {
            console.error('Failed to initialize request service:', e);
            showBackendWarning();
        }
    } else {
        console.warn('Supabase config missing; skipping data backend init.');
        showBackendWarning();
    }

    const page = window.location.pathname;

    if (page.includes("login.html")) {
        initializeAuthPage();
    }

    if (page.includes("submit.html")) {
        initializeSubmitPage();
    }

    if (page.includes("requests.html")) {
        initializeRequestPage();
    }
    if (page.includes("dashboard.html")) {
        initializeDashboardPage();
    }

});
