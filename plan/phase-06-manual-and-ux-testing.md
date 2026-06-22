# Phase 06 - Manual And UX Testing

## Objective

Use human review to catch what automated tests cannot: confusing flows, visual issues, and reviewer experience.

## User Testing Checklist

Run this as a real assignment reviewer would.

### Seller Flow

- Register as seller.
- Log in as seller.
- Create product with image, title, description, price, and quantity.
- Edit product.
- Delete product.
- Confirm seller cannot see buyer-only cart/checkout actions.

### Buyer Flow

- Register as buyer.
- Log in as buyer.
- Browse marketplace.
- Filter/search products.
- Open product detail.
- Add product to cart.
- Change cart quantity.
- Remove cart item.
- Checkout.
- Confirm stock decreases.
- Confirm buyer cannot access seller product creation.

### Negative Flow

- Try invalid login.
- Try product quantity below zero.
- Try checkout with more items than available stock.
- Try opening protected pages while logged out.
- Try refreshing page after login.

### UX Review

- Is it obvious whether you are logged in as buyer or seller?
- Is it obvious what action to take next?
- Are empty states helpful?
- Are errors visible and human-readable?
- Does the UI work on laptop and mobile width?
- Are buttons and forms named clearly?

## Agent Responsibilities

- Start local backend and frontend servers.
- Fix bugs found during manual testing.
- Use browser verification where possible.
- Check console errors and network failures.
- Adjust layout and copy where needed.

## User Responsibilities

- Perform the manual checklist.
- Tell the agent what felt confusing.
- Approve the final UX quality before documentation/submission polish.

## Done Criteria

- Required user stories work end to end.
- No blocking UX confusion remains.
- No obvious browser console errors.
- The app is presentable for assignment review.
