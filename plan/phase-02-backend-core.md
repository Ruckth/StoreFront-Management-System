# Phase 02 - Backend Core

## Objective

Build the backend foundation: authentication, roles, products, permissions, and image upload.

## Scope

- Django project setup.
- Django REST Framework setup.
- JWT authentication.
- Custom user model with `seller` and `buyer` roles.
- Register, login, token refresh, and current-user endpoint.
- Product CRUD API.
- Seller-only product creation.
- Seller ownership checks for product edits and deletes.
- Buyer/public product browsing.

## Agent Responsibilities

- Scaffold backend code.
- Implement models, serializers, views, URLs, and permissions.
- Add validation for product price and quantity.
- Add media settings for image upload.
- Run migrations.
- Run basic API checks with Django tests or local requests.

## User Responsibilities

- Register as seller and buyer in the browser or API client once frontend/API is available.
- Check whether error messages are understandable.
- Confirm that uploaded product images display correctly later in the frontend.

## Test Strategy

Automated backend tests:

- A user can register as buyer.
- A user can register as seller.
- Seller can create product.
- Buyer cannot create product.
- Seller can edit own product.
- Seller cannot edit another seller's product.
- Product with negative price or quantity is rejected.

Manual checks:

- Try logging in with wrong credentials.
- Try accessing seller APIs as buyer.
- Try uploading a product image.

## Done Criteria

- Backend server runs.
- Auth works.
- Product APIs work.
- Role restrictions are enforced.
- Initial backend tests pass.
