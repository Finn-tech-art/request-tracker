
import { initializeSubmitPage } from "./controllers/submitController.js";
import { initializeRequestPage } from "./controllers/requestController.js";
import { initializeDashboardPage } from "./controllers/dashboardController.js";

document.addEventListener("DOMContentLoaded", () => {

    const page = window.location.pathname;

    if (page.includes("submit.html")) {

        initializeSubmitPage();

    }

    if (page.includes("requests.html")) {

        initializeRequestPage();

    }
    if (page.includes("dashboard.html")) {
        initializeDashboardPage();
    }

});
