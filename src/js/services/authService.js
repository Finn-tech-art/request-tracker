const SESSION_KEY = "request-tracker-session";
const TOKEN_KEY = "rt_jwt";

function setCookie(name, value, days) {
    try {
        let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/`;
        if (typeof days === 'number') {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            str += `; expires=${expires}`;
        }
        document.cookie = str;
    } catch (e) { /* ignore */ }
}

function getCookie(name) {
    try {
        const match = document.cookie.split('; ').find(row => row.startsWith(`${encodeURIComponent(name)}=`));
        if (!match) return null;
        return decodeURIComponent(match.split('=')[1] || '');
    } catch (e) { return null; }
}

function deleteCookie(name) {
    try {
        document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } catch (e) { /* ignore */ }
}

function getSession() {
    const raw = getCookie(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}

function setSession(session) {
    if (session === null) deleteCookie(SESSION_KEY);
    else setCookie(SESSION_KEY, JSON.stringify(session), 1);
}

function clearSession() {
    deleteCookie(SESSION_KEY);
}

function getToken() {
    return getCookie(TOKEN_KEY);
}

function setToken(token) {
    if (token == null) deleteCookie(TOKEN_KEY);
    else setCookie(TOKEN_KEY, token); // session cookie
}

function clearToken() {
    deleteCookie(TOKEN_KEY);
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
