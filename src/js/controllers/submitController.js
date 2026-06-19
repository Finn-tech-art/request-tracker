
import requestService from "../services/requestService.js";
import { validateRequest } from "../utils/validator.js";

export function initializeSubmitPage() {

    const form = document.getElementById("request-form");

    if (!form) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const formData = {

            name: document.getElementById("name").value.trim(),

            email: document.getElementById("email").value.trim(),

            product: document.getElementById("product").value,

            requestType: document.getElementById("request-type").value,

            priority: document.getElementById("priority").value,

            message: document.getElementById("message").value.trim()

        };

        const validation = validateRequest(formData);

        if (!validation.valid) {

            alert(validation.errors.join("\n"));

            return;

        }

        try {
            await requestService.create(formData);
            alert("Request submitted successfully!");
            form.reset();
            window.location.href = "./requests.html";
        } catch (e) {
            console.error('Failed to submit request', e);
            alert('Failed to submit request. Please try again or contact admin.');
        }

    });

}
