This is a running journal of my though process and activity throughout the project.
(An overview of my workflow is [UI skeleton -> Javascript -> persistence.])

Started by writing the requirements specs documents which the guided the development of the system design and the database schema ....

created a project scaffold that is best suited for my workflow and architecture.
Then I initialised a git repository in my folder to track all changes and pmade the first commit. All changes will be being pushed into a remote github repository.

I then went ahead and started building the pages

Home page - this shows the welcome screen, navigation and CTA buttons
Routes submit a request CTA button to submit.html and view submitted requests CTA button to requests.html.

Submit.html - contains a html form with the following fields : Name, Email, product, Request Type, Priority, message and the submit button. Not wired to supabse yet and doesn't use javascript validation yet.

Requests.html - Contains the request list container. I will add dynamic funcionality later on.

I added a login functionality. login.html, auth.css and a dashboard for the reviewers- dashboard.html

---------------------------------------------------------------

The next thing I did was to add the javascript architecture.This makes the app live and dynamic 

app.js - starts the application. (initialize app -> determine current page -> load correct controller)

submitController.js - responsible for the submit page ( listen for form submission -> validate -> call requestService -> display success message -> redirect)

requestController.js - responsible for the requests.html (load requests -> ask render.js to display them -> handle search -> handle filters -> handle sorting)

requestService.js - create request , update request, delete request, get all requests, get one request.

render.js - contains all DOM rendering. renderRequestTable() renderStatus() renderCards()

validator.js - form validation
helper.js - small reusable utilities.

requestModel.js - defines what a request object looks like.
modal.js - allows you to click on a request row and get details about the request.


After that I tested by submitting a request from the form ( saving it to local storage) and having it automatically display in the requests.html page.

Then I added  search, filter by status and sort by date functionalities.

