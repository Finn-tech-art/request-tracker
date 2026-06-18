import Request from"../models/requestModel.js";
import { generateRequestId } from "../utils/helper.js";

import {
    getRequests,
    saveRequests
} from "./storageService.js"

class RequestService {
    create(data) {
        const requests = getRequests();
        const request = new Request({
            id: generateRequestId(),
            ...data,
            status: "Open"
        });

        requests.push(request);
        saveRequests(requests);
        return request;
    }

    getAll() {
        return getRequests();
    }

    getById(id) {
        const requests = getRequests();
        return requests.find(request => request.id === id);
    }

    update(id, changes) {
        const requests = getRequests();
        const idx = requests.findIndex(r => r.id === id);
        if (idx === -1) return null;
        const updated = { ...requests[idx], ...changes };
        requests[idx] = updated;
        saveRequests(requests);
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            try {
                window.dispatchEvent(new CustomEvent('request-updated', { detail: updated }));
            } catch (e) {
                // ignore
            }
        }
        return updated;
    }
}

export default new RequestService();