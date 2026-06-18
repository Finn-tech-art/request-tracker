
import requestService from "../services/requestService.js";
import { renderRequests } from "../ui/render.js";
import { showRequestModal } from "../ui/modal.js";

export function initializeRequestPage() {
    let allRequests = requestService.getAll() || [];

    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const productFilter = document.getElementById('product-filter');
    const sortSelect = document.getElementById('sort-select');
    const tbody = document.getElementById('request-table-body');

    function renderFiltered() {
        const searchValue = (searchInput?.value || '').trim().toLowerCase();
        const statusValue = statusFilter?.value || '';
        const productValue = productFilter?.value || '';
        const sortValue = sortSelect?.value || 'newest';

        let filtered = allRequests.slice();

        if (searchValue) {
            filtered = filtered.filter(r => {
                const hay = `${r.id} ${r.name} ${r.email} ${r.product} ${r.requestType} ${r.message}`.toLowerCase();
                return hay.includes(searchValue);
            });
        }

        if (statusValue) {
            filtered = filtered.filter(r => ((r.status || '').toLowerCase() === statusValue.toLowerCase()));
        }

            if (productValue) {
                filtered = filtered.filter(r => ((r.product || '') === productValue));
            }

        filtered.sort((a, b) => {
            const da = new Date(a.createdAt || 0);
            const db = new Date(b.createdAt || 0);
            return sortValue === 'oldest' ? (da - db) : (db - da);
        });

        renderRequests(filtered);
    }

    function debounce(fn, delay = 250) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    if (searchInput) searchInput.addEventListener('input', debounce(renderFiltered, 250));
    if (statusFilter) statusFilter.addEventListener('change', renderFiltered);
    if (productFilter) productFilter.addEventListener('change', renderFiltered);
    if (sortSelect) sortSelect.addEventListener('change', renderFiltered);

    // initial render
    // populate product filter options dynamically from data
    if (productFilter) {
        const products = Array.from(new Set(allRequests.map(r => r.product).filter(Boolean)));
        const opts = ["<option value=\"\">All products</option>", ...products.map(p => `<option value="${p}">${p}</option>`)].join('');
        productFilter.innerHTML = opts;
    }

    renderFiltered();

    // Update local data and re-render when a request is changed elsewhere
    window.addEventListener('request-updated', () => {
        allRequests = requestService.getAll() || [];
        if (productFilter) {
            const products = Array.from(new Set(allRequests.map(r => r.product).filter(Boolean)));
            const opts = ["<option value=\"\">All products</option>", ...products.map(p => `<option value="${p}">${p}</option>`)].join('');
            productFilter.innerHTML = opts;
        }
        renderFiltered();
    });

    if (tbody) {
        tbody.addEventListener("click", (e) => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const id = tr.dataset.id;
            if (!id) return;
            const req = requestService.getById(id);
            if (req) showRequestModal(req, { editable: false });
        });
    }

}
