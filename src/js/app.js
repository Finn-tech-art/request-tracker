
import { initializeSubmitPage } from "./controllers/submitController.js";
import { initializeRequestPage } from "./controllers/requestController.js";
import { initializeDashboardPage } from "./controllers/dashboardController.js";
import { initializeAuthPage } from "./controllers/authController.js";
import authService from "./services/authService.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Authentication is now handled by remote auth service (FastAPI).
    const page = window.location.pathname;

    if (page.includes("login.html")) {
        initializeAuthPage();
    }

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
