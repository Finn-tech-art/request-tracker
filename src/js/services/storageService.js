const STORAGE_KEY = "request-tracker";

export function getRequests() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveRequests(requests) {
    localStorage.setItem(
        STORAGE_KEY, JSON.stringify(requests)
    )
}

export function clearRequests() {
    localStorage.removeItem(STORAGE_KEY);
}