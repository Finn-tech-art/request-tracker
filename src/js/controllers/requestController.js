
import requestService from "../services/requestService.js";
import { renderRequests } from "../ui/render.js";
import { showRequestModal } from "../ui/modal.js";

export function initializeRequestPage() {

    const requests = requestService.getAll();

    renderRequests(requests);

    const tbody = document.getElementById("request-table-body");
    if (tbody) {
        tbody.addEventListener("click", (e) => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const id = tr.dataset.id;
            if (!id) return;
            const req = requestService.getById(id);
            if (req) showRequestModal(req);
        });
    }

}
