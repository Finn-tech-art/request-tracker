
import { formatDate } from "../utils/helper.js";

export function renderRequests(requests) {

    const table = document.getElementById(
        "request-table-body"
    );

    if (!table) return;

    if (requests.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No requests found.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = requests
        .map(request => `
            <tr>

                <td>${request.id}</td>

                <td>${request.name}</td>

                <td>${request.product}</td>

                <td>${request.requestType}</td>

                <td>${request.priority}</td>

                <td>${request.status}</td>

                <td>${formatDate(request.createdAt)}</td>

            </tr>
        `)
        .join("");

}

