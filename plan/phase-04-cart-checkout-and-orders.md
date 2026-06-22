# Phase 04 - Cart Checkout And Orders

## Objective

Implement the buyer purchasing workflow and inventory updates.

## Scope

- Active cart per buyer.
- Add product to cart.
- Update cart item quantity.
- Remove cart item.
- Checkout cart.
- Create order and order items.
- Reduce product inventory at checkout.
- Reject checkout if stock is insufficient.
- Buyer order history.

## Agent Responsibilities

- Implement cart and order backend models.
- Implement cart and checkout APIs.
- Use database transactions for checkout.
- Add frontend cart page.
- Add checkout action and success state.
- Add order history page if time allows.
- Add tests around inventory behavior.

## User Responsibilities

- Manually test a realistic buyer flow.
- Confirm stock changes are visible after purchase.
- Check whether the checkout flow feels understandable.
- Try edge cases like buying more than available stock.

## Test Strategy

Automated backend tests:

- Buyer can add item to cart.
- Seller cannot checkout as buyer.
- Checkout creates order.
- Checkout decreases inventory.
- Checkout rejects insufficient stock.
- Checkout clears or closes active cart.

Manual UX checks:

- Add multiple products to cart.
- Change quantity.
- Remove item.
- Checkout.
- Verify product stock decreases.
- Verify order appears in order history if implemented.

## Done Criteria

- Buyer can complete purchase flow.
- Inventory is updated correctly.
- Insufficient stock is handled cleanly.
- Cart and checkout tests pass.
