import requestService from "../services/requestService.js";
import { formatDate } from "../utils/helper.js";
import { showRequestModal } from "../ui/modal.js";

export function initializeDashboardPage() {
    const totalEl = document.getElementById("totalRequests");
    const openEl = document.getElementById("openRequests");
    const progressEl = document.getElementById("progressRequests");
    const resolvedEl = document.getElementById("resolvedRequests");
    const recentEl = document.getElementById("recentRequests");

    const requests = requestService.getAll();

    if (totalEl) totalEl.textContent = requests.length;
    const openCount = requests.filter(r => r.status === "Open").length;
    const progressCount = requests.filter(r => r.status === "In Progress" || r.status === "In-Progress").length;
    const resolvedCount = requests.filter(r => r.status === "Resolved" || r.status === "Closed").length;

    if (openEl) openEl.textContent = openCount;
    if (progressEl) progressEl.textContent = progressCount;
    if (resolvedEl) resolvedEl.textContent = resolvedCount;

    if (recentEl) {
        if (requests.length === 0) {
            recentEl.innerHTML = `<tr><td colspan="5" style="text-align:center">No requests available.</td></tr>`;
        } else {
            const sorted = requests.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            recentEl.innerHTML = sorted.slice(0, 10).map(r => `
                <tr data-id="${r.id}">
                    <td>${r.id}</td>
                    <td>${r.name}</td>
                    <td>${r.requestType}</td>
                    <td>${r.status}</td>
                    <td>${r.priority || ''}</td>
                </tr>
            `).join("");
        }
    }

    if (recentEl) {
        recentEl.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            if (!tr) return;
            const id = tr.dataset.id;
            if (!id) return;
            const req = requestService.getById(id);
            if (req) showRequestModal(req);
        });
    }
}
