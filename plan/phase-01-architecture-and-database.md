# Phase 01 - Architecture And Database

## Objective

Design the system architecture and database before implementation.

## Recommended Architecture

- Backend: Django + Django REST Framework.
- Auth: JWT access and refresh tokens.
- Frontend: React + TypeScript.
- Database: SQLite for speed, PostgreSQL for stronger production signal.
- Media: local file upload for product images.

## Proposed Apps

- `users`: custom user model and role handling.
- `products`: product listing and seller ownership.
- `cart`: buyer cart and cart items.
- `orders`: checkout and finalized orders.

## Proposed Entities

- User
- Product
- Cart
- CartItem
- Order
- OrderItem

## Agent Responsibilities

- Draft the ER diagram.
- Create initial model plan.
- Define API routes.
- Identify permissions for every resource.
- Convert the design into implementation tasks.

## User Responsibilities

- Review the ER diagram for business clarity.
- Confirm that order history should keep price/title snapshots.
- Confirm whether filters should include search, price range, stock status, or seller.

## Test Strategy

Design validation:

- Every product belongs to one seller.
- Every cart belongs to one buyer.
- Every order belongs to one buyer.
- Checkout creates order items from cart items.
- Inventory cannot become negative.

## Done Criteria

- ER diagram exists in `docs/`.
- API route list is agreed.
- Model fields are clear.
- Permission rules are clear.
