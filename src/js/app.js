
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
        // no build-time config present — will fall back to fetching /config from auth server or defaults
    }

    // Load runtime config from the auth service (SUPABASE keys, optional AUTH_API_URL)
    const defaultAuth = 'http://127.0.0.1:8000';
    const configuredAuth = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.AUTH_API_URL) ? window.APP_CONFIG.AUTH_API_URL.replace(/\/$/, '') : null;
    const authBase = configuredAuth || defaultAuth;
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
            // fallback: at least set AUTH_API_URL so controllers know where to call
            window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, { AUTH_API_URL: authBase });
            console.warn('Failed to load config from auth server:', res.status);
        }
    } catch (e) {
        window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, { AUTH_API_URL: authBase });
        console.warn('Could not reach auth server for config:', e);
    }

    // Initialize request service (connect to Supabase). This will throw if supabase config is missing.
    try {
        await requestService.init(window.APP_CONFIG || {});
    } catch (e) {
        console.error('Failed to initialize request service:', e);
        alert('Failed to initialize data backend (Supabase). Check configuration and /config endpoint.');
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
