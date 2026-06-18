
export function validateRequest(data) {

    const errors = [];

    if (!data.name.trim())
        errors.push("Name is required.");

    if (!data.email.trim())
        errors.push("Email is required.");

    if (!data.product)
        errors.push("Product is required.");

    if (!data.requestType)
        errors.push("Request type is required.");

    // Priority is optional; don't require it here.

    if (!data.message.trim())
        errors.push("Message is required.");

    return {

        valid: errors.length === 0,

        errors

    };

}

