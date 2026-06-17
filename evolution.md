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

