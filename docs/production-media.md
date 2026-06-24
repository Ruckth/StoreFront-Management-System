# Production Product Images

Product images are uploaded to UploadThing from the browser, then Django stores
the returned public URL in `Product.image`.

Required frontend service environment variables:

```text
UPLOADTHING_TOKEN=
API_BASE_URL=https://your-backend.up.railway.app/api
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
UPLOADTHING_CALLBACK_URL=https://your-frontend.up.railway.app/api/uploadthing
```

The UploadThing route verifies the seller's JWT against Django before issuing
upload URLs. Django no longer stores product images on local disk, so Railway
volumes are not required for product image persistence.

After deploying this migration, run the one-time cleanup command if old product
rows point to missing `/media/` files:

```bash
python manage.py cleanup_product_uploadthing_migration
```

Then create fresh product listings through the seller UI.
