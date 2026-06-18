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
}

export default new RequestService();