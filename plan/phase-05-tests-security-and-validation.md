# Phase 05 - Tests Security And Validation

## Objective

Strengthen the assignment around the evaluation criteria: tests, security, validation, and error handling.

## Agent Responsibilities

- Expand backend test coverage.
- Check permission behavior endpoint by endpoint.
- Add serializer/model validation.
- Ensure useful HTTP status codes.
- Check `.env` usage.
- Check `.gitignore`.
- Run backend tests.
- Run frontend build.

## User Responsibilities

- Review manual test behavior for confusing errors.
- Confirm no sensitive credentials are committed.
- Try basic negative flows in the UI.

## Automated Test Targets

Authentication:

- Register valid user.
- Reject duplicate email.
- Reject invalid role.
- Login returns tokens.

Authorization:

- Buyer cannot create products.
- Seller cannot use buyer checkout.
- Seller cannot edit another seller's product.
- Anonymous users cannot access protected actions.

Inventory:

- Quantity cannot go below zero.
- Checkout is transactional.
- Insufficient stock returns a clear error.

Validation:

- Product title is required.
- Price must be positive.
- Quantity must be zero or greater.
- Cart item quantity must be positive.

## Manual Test Targets

- Wrong password.
- Expired/missing token behavior.
- Empty product list.
- Empty cart.
- Checkout failure message.
- Image upload failure message.

## Done Criteria

- Critical backend tests pass.
- Frontend builds.
- Security-sensitive files are ignored.
- Validation errors are clear enough for a reviewer.
