# StoreFront Management System API Contract

This document defines the Phase 1 REST API contract for backend and frontend implementation.

## API Defaults

- Base URL: `/api`
- Request format: JSON, except product image upload uses `multipart/form-data`
- Response format: JSON
- Auth: JWT bearer token
- Auth header: `Authorization: Bearer <access_token>`
- Date format: ISO 8601 strings
- Currency fields: decimal strings, for example `"129.99"`

## Roles

| Role | Allowed Capabilities |
| --- | --- |
| Anonymous | Register, login, refresh token, browse products, view product detail |
| Buyer | Browse products, manage cart, checkout, view own orders |
| Seller | Create, edit, and delete own products |

## Common Error Shape

Use DRF-style validation errors.

```json
{
  "detail": "Error message"
}
```

Field validation errors may return:

```json
{
  "unit_price": ["Ensure this value is greater than 0."]
}
```

## Authentication

### Register

`POST /api/auth/register/`

Access: anonymous

Request:

```json
{
  "email": "buyer@example.com",
  "password": "StrongPassword123",
  "role": "buyer"
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "email": "buyer@example.com",
  "role": "buyer"
}
```

Validation:

- `email` is required and must be unique.
- `password` is required.
- `role` must be `buyer` or `seller`.

### Login

`POST /api/auth/login/`

Access: anonymous

Request:

```json
{
  "email": "buyer@example.com",
  "password": "StrongPassword123"
}
```

Response `200 OK`:

```json
{
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token",
  "user": {
    "id": 1,
    "email": "buyer@example.com",
    "role": "buyer"
  }
}
```

Errors:

- `401 Unauthorized` for invalid credentials.

### Refresh Token

`POST /api/auth/token/refresh/`

Access: anonymous

Request:

```json
{
  "refresh": "jwt-refresh-token"
}
```

Response `200 OK`:

```json
{
  "access": "new-jwt-access-token"
}
```

### Current User

`GET /api/auth/me/`

Access: authenticated

Response `200 OK`:

```json
{
  "id": 1,
  "email": "buyer@example.com",
  "role": "buyer"
}
```

## Products

### List Products

`GET /api/products/?search=&in_stock=`

Access: anonymous, buyer, seller

Query parameters:

| Parameter | Type | Notes |
| --- | --- | --- |
| `search` | String | Match product title or description |
| `in_stock` | Boolean | When `true`, return products where `available_quantity > 0` |

Response `200 OK`:

```json
[
  {
    "id": 1,
    "seller": {
      "id": 2,
      "email": "seller@example.com"
    },
    "image": "http://localhost:8000/media/products/example.jpg",
    "title": "Notebook",
    "description": "A5 dotted notebook",
    "unit_price": "129.00",
    "available_quantity": 10,
    "created_at": "2026-06-22T10:00:00Z",
    "updated_at": "2026-06-22T10:00:00Z"
  }
]
```

### Product Detail

`GET /api/products/:id/`

Access: anonymous, buyer, seller

Response `200 OK`: same object shape as list item.

Errors:

- `404 Not Found` when product does not exist.

### Create Product

`POST /api/products/`

Access: seller only

Content type: `multipart/form-data`

Request fields:

| Field | Type | Required |
| --- | --- | --- |
| `image` | File | Yes |
| `title` | String | Yes |
| `description` | String | Yes |
| `unit_price` | Decimal | Yes |
| `available_quantity` | Integer | Yes |

Response `201 Created`: product detail object.

Errors:

- `401 Unauthorized` when unauthenticated.
- `403 Forbidden` when authenticated user is not a seller.
- `400 Bad Request` for missing or invalid fields.

### Update Product

`PATCH /api/products/:id/`

Access: owning seller only

Content type: `multipart/form-data` or JSON when image is unchanged.

Request:

```json
{
  "title": "Updated Notebook",
  "unit_price": "149.00",
  "available_quantity": 8
}
```

Response `200 OK`: product detail object.

Errors:

- `401 Unauthorized` when unauthenticated.
- `403 Forbidden` when user is not the owning seller.
- `404 Not Found` when product does not exist.
- `400 Bad Request` for invalid fields.

### Delete Product

`DELETE /api/products/:id/`

Access: owning seller only

Response `204 No Content`

Errors:

- `401 Unauthorized` when unauthenticated.
- `403 Forbidden` when user is not the owning seller.
- `404 Not Found` when product does not exist.

## Cart

### Get Active Cart

`GET /api/cart/`

Access: buyer only

Response `200 OK`:

```json
{
  "id": 1,
  "status": "active",
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "title": "Notebook",
        "image": "http://localhost:8000/media/products/example.jpg",
        "unit_price": "129.00",
        "available_quantity": 10
      },
      "quantity": 2,
      "line_total": "258.00"
    }
  ],
  "total_price": "258.00",
  "created_at": "2026-06-22T10:00:00Z",
  "updated_at": "2026-06-22T10:05:00Z"
}
```

Errors:

- `401 Unauthorized` when unauthenticated.
- `403 Forbidden` when authenticated user is not a buyer.

### Add Cart Item

`POST /api/cart/items/`

Access: buyer only

Request:

```json
{
  "product_id": 1,
  "quantity": 2
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "product": {
    "id": 1,
    "title": "Notebook",
    "image": "http://localhost:8000/media/products/example.jpg",
    "unit_price": "129.00",
    "available_quantity": 10
  },
  "quantity": 2,
  "line_total": "258.00"
}
```

Implementation rule: if the product is already in the active cart, increase the existing cart item quantity instead of creating a duplicate.

Validation:

- `product_id` must reference an existing product.
- `quantity` must be greater than 0.
- `quantity` must not exceed current product stock.

### Update Cart Item

`PATCH /api/cart/items/:id/`

Access: buyer only, item owner only

Request:

```json
{
  "quantity": 3
}
```

Response `200 OK`: cart item object.

Validation:

- `quantity` must be greater than 0.
- `quantity` must not exceed current product stock.

Errors:

- `403 Forbidden` when item belongs to another buyer.
- `404 Not Found` when cart item does not exist.

### Remove Cart Item

`DELETE /api/cart/items/:id/`

Access: buyer only, item owner only

Response `204 No Content`

Errors:

- `403 Forbidden` when item belongs to another buyer.
- `404 Not Found` when cart item does not exist.

### Checkout

`POST /api/cart/checkout/`

Access: buyer only

Request: empty body

Response `201 Created`:

```json
{
  "id": 1,
  "total_price": "258.00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_title_snapshot": "Notebook",
      "unit_price_snapshot": "129.00",
      "quantity": 2,
      "line_total": "258.00"
    }
  ],
  "created_at": "2026-06-22T10:10:00Z"
}
```

Implementation rules:

- Checkout must be transactional.
- Reject checkout if the active cart is empty.
- Reject checkout if any item quantity exceeds current stock.
- Decrease product inventory only after all cart items are validated.
- Mark the cart as `checked_out` after order creation.

Errors:

- `400 Bad Request` when cart is empty.
- `400 Bad Request` when stock is insufficient.
- `403 Forbidden` when authenticated user is not a buyer.

## Orders

### List Orders

`GET /api/orders/`

Access: buyer only

Response `200 OK`:

```json
[
  {
    "id": 1,
    "total_price": "258.00",
    "item_count": 1,
    "created_at": "2026-06-22T10:10:00Z"
  }
]
```

### Order Detail

`GET /api/orders/:id/`

Access: buyer owner only

Response `200 OK`:

```json
{
  "id": 1,
  "total_price": "258.00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_title_snapshot": "Notebook",
      "unit_price_snapshot": "129.00",
      "quantity": 2,
      "line_total": "258.00"
    }
  ],
  "created_at": "2026-06-22T10:10:00Z"
}
```

Errors:

- `401 Unauthorized` when unauthenticated.
- `403 Forbidden` when authenticated user is not the buyer owner.
- `404 Not Found` when order does not exist.

## Acceptance Criteria

- Anonymous users can register, login, list products, and view product detail.
- Buyers can manage only their own cart and orders.
- Sellers can manage only their own products.
- Buyers cannot create, update, or delete products.
- Sellers cannot create cart items, checkout, or view buyer orders.
- Product inventory decreases after successful checkout.
- Checkout never leaves inventory negative.
- Order item snapshot fields remain stable after product changes.
