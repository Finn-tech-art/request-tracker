import Request from"../models/requestModel.js";
import { generateRequestId } from "../utils/helper";

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
        return getRequests().find(
            request => request.id === id
        );

        if (!request) return;
        request.status = status;
        saveRequests(requests);
    }
}

export default new RequestService();