export function generateRequestId() {
    const random = Math.floor(Math.random() * 900000) + 100000;
    return `REQ-${Date.now()}-${random}`;
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

export function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}
