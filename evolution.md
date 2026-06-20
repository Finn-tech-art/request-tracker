This is a running journal of my thought process and activity throughout the project.
It is not a polished tutorial. It is the running average of my work journal: what I built, what changed, what broke, and how I adjusted the project as I learned more.

My overall workflow was:

```text
UI skeleton -> JavaScript behavior -> persistence -> backend -> deployment -> production fixes
```

I started by reading the assessment requirements and writing down the basic shape of the system: a user should be able to submit a request, view submitted requests, and manage request status. From there I created the initial project scaffold and initialized a Git repository so changes could be tracked over time.

The first implementation phase was the static UI:

- `index.html` for the home page, welcome message, navigation, and CTA buttons.
- `submit.html` for the request form.
- `requests.html` for the request list.
- `login.html` for admin login.
- `dashboard.html` for the reviewer/admin view.

At this stage the submit page had the core fields required by the task: name, email, product, request type, priority, message, and a submit button. The request list existed visually, but it still needed dynamic behavior.

After the HTML and CSS skeleton, I added the JavaScript architecture:

- `app.js` starts the application, detects the current page, and loads the correct controller.
- `submitController.js` listens for form submission, validates the form, calls `requestService`, shows feedback, and redirects.
- `requestController.js` loads requests, renders them, and handles search, filtering, and sorting.
- `dashboardController.js` handles the admin dashboard view.
- `authController.js` handles login.
- `requestService.js` is responsible for creating, reading, and updating requests.
- `render.js` contains the DOM rendering logic.
- `validator.js` handles form validation.
- `helper.js` contains reusable helpers.
- `requestModel.js` defines the request object shape.
- `modal.js` allows a user to click a request row and inspect details.

I then tested the core flow by submitting requests from the form and rendering them in the request list. After that I added search, filtering by status/product, and sorting by date so the request list became easier to use.

The next phase was admin functionality. I added a login flow and a dashboard so reviewers/admins could manage request statuses. For authentication I used a small FastAPI backend with environment-based admin credentials and JWT verification.

This changed the hosting plan. The project began as a static frontend, but once login and server-side persistence were added, it needed a backend. I chose Render and created `api/app.py` plus `render.yaml` so the project could run as one Python web service.

I then integrated Supabase. The backend now proxies requests to Supabase instead of exposing the service key to browser JavaScript. The frontend talks to the same-origin FastAPI API, and FastAPI talks to Supabase using server-side environment variables.

The current backend responsibilities are:

- Serve the static frontend from `src/`.
- Provide runtime config through `/config` and `/js/config/config.js`.
- Authenticate admin users through `/login`.
- Verify JWT tokens through `/verify`.
- Proxy request list, create, and update operations to Supabase.

During production testing on Render I found a route issue. The deployed app served `/` and `/pages/*.html`, but clean top-level page URLs such as `/submit.html`, `/dashboard.html`, and `/login.html` returned FastAPI's JSON `{"detail":"Not Found"}` response.

To fix this, I added backend aliases for the page routes:

```text
/submit.html
/submit
/requests.html
/login.html
/login
/dashboard.html
/dashboard
```

Then I found a more important conflict: `/requests` was being used as the JSON API endpoint, but it should also be the natural clean URL for the submitted requests page. I fixed that by moving the data API to `/api/requests` and making `/requests` serve the request-list page.

The current page routes are:

```text
/          Home
/submit    Submit request page
/requests  Request list page
/login     Admin login page
/dashboard Admin dashboard
```

The current request API routes are:

```text
GET    /api/requests
POST   /api/requests
PATCH  /api/requests/{request_id}
```

I also updated the frontend navigation and redirects to use clean absolute routes:

```text
/submit
/requests
/login
/dashboard
```

After changing the route structure, I checked the submit flow again. I found that the JavaScript page detection still only initialized controllers for paths containing `.html`, which meant `/submit` could render the page without attaching the form submit handler. I updated `app.js` so both clean routes and `.html` routes initialize the correct controller.

I also found a persistence issue in the request creation path. The frontend generated a request ID, but the `jsToDb()` function did not include `id` in the payload sent to the backend. The backend also did not include an `id` when inserting into Supabase. Since the documented Supabase schema uses `id text primary key`, inserts could fail without an ID.

I fixed that by:

- Preserving `id` in the frontend payload.
- Accepting `id` in the FastAPI `RequestIn` model.
- Adding a server-side fallback ID if the frontend does not send one.
- Making generated request IDs less collision-prone by including a timestamp and a larger random number.

I verified the backend insert path with a mocked Supabase call. A `POST /api/requests` request now produces a payload like:

```text
id
name
email
product
request_type
priority
message
status
created_at
```

That means the submit button should now insert a row into Supabase after deployment, assuming the Render environment has the correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

Where the project is now:

- The app has a deployed full-stack shape.
- Static pages are served by FastAPI.
- User-facing routes are clean.
- API routes are separated under `/api`.
- Supabase is the persistence layer.
- Admin login and status updates exist.
- Search, filter, sorting, request details, and dashboard views are implemented.

What I would still improve:

- Add automated tests.
- Polish the UI and mobile spacing.
- Improve error states and loading states.
- Align status labels more closely with the assessment wording if required.
- Add CSV export or delete/archive actions.
- Improve production security settings.

I also used AI support during debugging and documentation cleanup, especially around the Render route issue, the `/requests` API/page conflict, and this README update. I treated it as a support tool: the important part was still understanding the app flow, checking the behavior, and recording the reasoning here.
