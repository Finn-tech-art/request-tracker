import { formatDate } from "../utils/helper.js";
import requestService from "../services/requestService.js";

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function showRequestModal(request, { editable = false } = {}) {
    closeRequestModal();

    const overlay = document.createElement("div");
    overlay.className = "rt-modal-overlay";

    overlay.innerHTML = `
      <div class="rt-modal" role="dialog" aria-modal="true" aria-label="Request details">
        <header class="rt-modal-header">
          <h2>${escapeHtml(request.id)} - ${escapeHtml(request.requestType || "")}</h2>
          <button class="rt-modal-close" aria-label="Close">&times;</button>
        </header>
        <div class="rt-modal-body">
          <p><strong>Name:</strong> ${escapeHtml(request.name || "")}</p>
          <p><strong>Email:</strong> ${escapeHtml(request.email || "")}</p>
          <p><strong>Product:</strong> ${escapeHtml(request.product || "")}</p>
          <p><strong>Priority:</strong> ${escapeHtml(request.priority || "")}</p>
          <p><strong>Status:</strong> ${escapeHtml(request.status || "")}</p>
          ${editable ? `
          <div style="margin-top:6px;">
            <label for="rt-status-select"><strong>Change status:</strong></label>
            <select id="rt-status-select" style="margin-left:8px;padding:6px;border-radius:6px;border:1px solid #ddd">
              <option value="Open" ${request.status === 'Open' ? 'selected' : ''}>Open</option>
              <option value="In Progress" ${request.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="In-Progress" ${request.status === 'In-Progress' ? 'selected' : ''}>In-Progress</option>
              <option value="Resolved" ${request.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
              <option value="Closed" ${request.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
          <hr>
          ` : '<hr>'}
          <div class="rt-modal-message">${escapeHtml(request.message || "").replace(/\n/g, "<br>")}</div>
          <p class="rt-modal-date"><small>Submitted: ${formatDate(request.createdAt)}</small></p>
        </div>
        <footer class="rt-modal-footer">
          <button class="btn btn-secondary rt-modal-close">Close</button>
          ${editable ? '<button class="btn btn-primary rt-modal-save">Save</button>' : ''}
        </footer>
      </div>
    `;

    document.body.appendChild(overlay);

    if (!document.getElementById("rt-modal-styles")) {
        const style = document.createElement("style");
        style.id = "rt-modal-styles";
        style.textContent = `
        .rt-modal-overlay{
          position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:9999;padding:24px}
        .rt-modal{
          background:#fff;max-width:760px;width:100%;border-radius:10px;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.35);color:#222;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial}
        .rt-modal-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-bottom:8px;border-bottom:1px solid #eee}
        .rt-modal-header h2{font-size:1.125rem;margin:0;font-weight:600}
        .rt-modal-close{border:none;background:transparent;font-size:22px;cursor:pointer;color:#444;padding:6px;border-radius:6px}
        .rt-modal-close:hover{background:#f6f6f6}
        .rt-modal-body{margin-top:16px;max-height:60vh;overflow:auto;line-height:1.6;font-size:0.98rem}
        .rt-modal-body p{margin:8px 0}
        .rt-modal-body p strong{display:inline-block;width:110px;color:#333;font-weight:600}
        .rt-modal-message{margin-top:12px;padding:12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;white-space:pre-wrap}
        .rt-modal-date{color:#666;margin-top:10px;display:block}
        .rt-modal-footer{display:flex;justify-content:flex-end;margin-top:16px;gap:8px}
        .rt-modal .btn{padding:8px 12px;border-radius:6px;border:1px solid transparent;cursor:pointer;font-weight:600}
        .rt-modal .btn-secondary{background:#f5f5f5;border-color:#e6e6e6;color:#222}
        .rt-modal .btn-primary{background:#2563eb;color:#fff;border-color:#1e40af}
        .rt-modal .rt-modal-save{background:#000;color:#fff;border-color:#000}
        .rt-modal .rt-modal-save:hover{background:#111}
        @media (max-width:480px){.rt-modal{padding:14px}.rt-modal-header h2{font-size:1rem}.rt-modal-body{font-size:0.95rem}}
        `;
        document.head.appendChild(style);
    }

    overlay.querySelectorAll('.rt-modal-close').forEach(btn => btn.addEventListener('click', closeRequestModal));

    if (editable) {
      const saveBtn = overlay.querySelector('.rt-modal-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const sel = overlay.querySelector('#rt-status-select');
          if (!sel) return;
          const newStatus = sel.value;
          if (!newStatus) return;
          try {
            await requestService.update(request.id, { status: newStatus });
          } catch (e) {
            console.error('Failed to update request status', e);
            alert('Failed to update status.');
          }
          closeRequestModal();
        });
      }
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeRequestModal();
    });

    function onKey(e) { if (e.key === 'Escape') closeRequestModal(); }
    document.addEventListener('keydown', onKey);
    overlay._onKey = onKey;
}

export function closeRequestModal() {
    const overlay = document.querySelector('.rt-modal-overlay');
    if (!overlay) return;
    if (overlay._onKey) document.removeEventListener('keydown', overlay._onKey);
    overlay.remove();
}
