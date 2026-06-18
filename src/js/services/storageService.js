const STORAGE_KEY = "request-tracker";

export function getRequests() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        console.warn("Failed to parse requests from localStorage, resetting.", e);
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
}

export function saveRequests(requests) {
    localStorage.setItem(
        STORAGE_KEY, JSON.stringify(requests)
    )
}

export function clearRequests() {
    localStorage.removeItem(STORAGE_KEY);
}