# Phase 03 - Frontend Core

## Objective

Build the first usable frontend for authentication, marketplace browsing, and seller product management.

## Scope

- React + TypeScript project setup.
- API client with JWT handling.
- Login page.
- Register page with role selector.
- Buyer marketplace page.
- Product detail page.
- Seller dashboard.
- Product create/edit form.
- Product delete action.
- Protected routes by role.

## Agent Responsibilities

- Scaffold frontend code.
- Create typed API functions.
- Build pages and reusable components.
- Wire authentication state.
- Add basic loading, empty, and error states.
- Run frontend build/lint where available.

## User Responsibilities

- Manually test the main screens in the browser.
- Confirm whether the UI feels clear enough for a reviewer.
- Check that role-specific navigation makes sense.
- Check mobile and desktop layout basics.

## Test Strategy

Agent checks:

- Frontend compiles.
- Main routes render.
- API calls are wired to backend endpoints.
- Browser console has no obvious errors.

Manual UX checks:

- Register as seller.
- Create a product.
- Log out.
- Register as buyer.
- Browse products.
- Open product details.
- Confirm navigation is understandable without instructions.

## Done Criteria

- Frontend runs locally.
- Seller can manage products through UI.
- Buyer can browse products through UI.
- Login/register flow works.
- No major layout breaks on common viewport sizes.
