const SESSION_KEY = "request-tracker-session";
const TOKEN_KEY = "rt_jwt";

function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}

function setSession(session) {
    if (session === null) {
        localStorage.removeItem(SESSION_KEY);
    } else {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    if (token == null) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function logout() {
    clearSession();
    clearToken();
}

function isLoggedIn() {
    return !!getSession() || !!getToken();
}

function isAdmin() {
    const s = getSession();
    return !!(s && s.isAdmin);
}

// Optionally verify the stored token with the remote auth service and refresh session
async function verifyTokenWithServer(authBaseUrl) {
    const token = getToken();
    if (!token || !authBaseUrl) return null;
    const url = `${authBaseUrl.replace(/\/$/, '')}/verify`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.username) {
            const session = { username: data.username, name: data.name || '', isAdmin: !!data.isAdmin };
            setSession(session);
            return session;
        }
    } catch (e) {
        return null;
    }
    return null;
}

export default {
    getSession,
    setSession,
    clearSession,
    getToken,
    setToken,
    clearToken,
    logout,
    isLoggedIn,
    isAdmin,
    verifyTokenWithServer
};
