# Requirements Prompt for feature_013

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_013/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_013/plan.md' in order to to that.

## Feature Brief

Skeleton for the frontend application

## User Story

As a user, I want to be able to access a UI for managing the Portfolio Digital

## Key Requirements

### Requirement 1: Architecture

Follow the architecture described in specs/architecture_frontend.md

### Requirement 2: Dark / Light Mode

The user interface should have a light / dark mode

### Requirement 3: Public Landing Page

By default, the initial page will be a landing page accessible on route /

The landing page will have the contents specified in specs/features/feature>\_013/contents_home_page.md

### Requierement 4: Navigation Bar

The application should have a navigation bar on the top of the screen. The navigation bar should be sticky. It will have the capabilities to have dropdown menus (to de defined later).

Public menu items, of the navigation bar will be:

- Portfolio logo --> links to /

On the right side, using Clerk components:

- If user is not logged in: Sign-in, sign-up menu items
- If user is logged in: Sign-out menu item, user menu

On the right side: dark mode / light mode toggle.

### Requirement 5: User sign-in / sign-out

User will be able to sign-up, sign-in. sig-out using Clerk.

### Requirement 6: User Menu

The user will follow Clerk best practices and have a user avatar from clerk.

### Requirement 7: private menu items

Besides the public menu items, the Navbar will have the following items:

- Dashboard
- Search
- Register
- Jobs

We will define the contents in features in the future.

### Requirement 8: Dashboard

The Dashboard will be in page /dashboard

Please provide a number of KPI and charts showing the composition of the portfolio,using data from table datos_relevantes that you can access using the API.

Never consider initiatives in estado = Cancelada.

### Requirement 9: Private routes

All the routes except for / and the sign-up / log-in cannot be access unless the user is registeed and logged in.

### Requirement 10: log-in and log-off pages

When the user is logged-in, he should be redirected to /dashboard

When the user is logged-out, he should be redirected to /

### General requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_frontend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md

## Constraints

- The existing application functionality from previuos versions should be maintained as is, expect for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
