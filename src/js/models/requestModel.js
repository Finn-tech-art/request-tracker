export default class Request {
    constructor({
        id,
        name,
        email,
        product,
        requestType,
        priority = "",
        message,
        status = "Open",
        createdAt = new Date().toISOString()
    }) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.product = product;
        this.requestType = requestType;
        this.priority = priority;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
    }
}