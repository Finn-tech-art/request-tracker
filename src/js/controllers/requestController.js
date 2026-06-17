
import requestService from "../services/requestService.js";
import { renderRequests } from "../ui/render.js";

export function initializeRequestPage() {

    const requests = requestService.getAll();

    renderRequests(requests);

}
