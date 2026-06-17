
import { initializeSubmitPage } from "./controllers/submitController.js";
import { initializeRequestPage } from "./controllers/requestController.js";

document.addEventListener("DOMContentLoaded", () => {

    const page = window.location.pathname;

    if (page.includes("submit.html")) {

        initializeSubmitPage();

    }

    if (page.includes("requests.html")) {

        initializeRequestPage();

    }

});
