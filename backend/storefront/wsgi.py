"""WSGI config for the StoreFront project."""
import os

from django.core.wsgi import get_wsgi_application


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "storefront.settings")

application = get_wsgi_application()
