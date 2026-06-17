export function generateRequestId() {
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `REQ-${random}`;
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

export function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}