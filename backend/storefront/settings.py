from datetime import timedelta
from pathlib import Path
from urllib.parse import unquote, urlparse
import os

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent
IS_RAILWAY = bool(os.getenv("RAILWAY_ENVIRONMENT_NAME"))


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def env_list(name, default):
    value = os.getenv(name)
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def append_unique(values, *items):
    result = list(values)
    for item in items:
        if item and item not in result:
            result.append(item)
    return result


def normalize_origin(value):
    if not value:
        return None
    value = value.strip().rstrip("/")
    parsed = urlparse(value)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return value


def env_origins(name, default):
    return [
        origin
        for origin in (normalize_origin(item) for item in env_list(name, default))
        if origin
    ]


def origin_from_domain(domain):
    if not domain:
        return None
    if domain.startswith(("http://", "https://")):
        return normalize_origin(domain)
    return f"https://{domain}"


def database_from_url(value):
    parsed = urlparse(value)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured("DATABASE_URL must use postgres:// or postgresql://.")

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed.path.lstrip("/")),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or ""),
    }


def railway_postgres_config():
    if not all(os.getenv(name) for name in ("PGDATABASE", "PGUSER", "PGHOST")):
        return None

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("PGDATABASE"),
        "USER": os.getenv("PGUSER"),
        "PASSWORD": os.getenv("PGPASSWORD", ""),
        "HOST": os.getenv("PGHOST"),
        "PORT": os.getenv("PGPORT", "5432"),
    }


DEBUG = env_bool("DEBUG", not IS_RAILWAY)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-storefront-secret-key-change-before-production")
if not DEBUG and SECRET_KEY == "dev-only-storefront-secret-key-change-before-production":
    raise ImproperlyConfigured("SECRET_KEY must be set when DEBUG is disabled.")

ALLOWED_HOSTS = append_unique(
    env_list("ALLOWED_HOSTS", ["localhost", "127.0.0.1", "[::1]"]),
    "healthcheck.railway.app",
    os.getenv("RAILWAY_PUBLIC_DOMAIN"),
    os.getenv("RAILWAY_PRIVATE_DOMAIN"),
)


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "users",
    "products",
    "orders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

if not DEBUG or IS_RAILWAY:
    security_middleware_index = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware")
    MIDDLEWARE.insert(
        security_middleware_index + 1,
        "whitenoise.middleware.WhiteNoiseMiddleware",
    )

ROOT_URLCONF = "storefront.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "storefront.wsgi.application"

DATABASE_URL = os.getenv("DATABASE_URL")
POSTGRES_CONFIG = railway_postgres_config()
if DATABASE_URL:
    DATABASES = {"default": database_from_url(DATABASE_URL)}
elif POSTGRES_CONFIG:
    DATABASES = {"default": POSTGRES_CONFIG}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MEDIA_URL = "/media/"
RAILWAY_VOLUME_MOUNT_PATH = os.getenv("RAILWAY_VOLUME_MOUNT_PATH")
MEDIA_ROOT = Path(
    os.getenv(
        "MEDIA_ROOT",
        str(
            Path(RAILWAY_VOLUME_MOUNT_PATH) / "media"
            if RAILWAY_VOLUME_MOUNT_PATH
            else BASE_DIR / "media"
        ),
    )
)
SERVE_MEDIA_FILES = env_bool("SERVE_MEDIA_FILES", DEBUG or bool(RAILWAY_VOLUME_MOUNT_PATH))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.User"

CORS_ALLOWED_ORIGINS = append_unique(
    env_origins(
        "CORS_ALLOWED_ORIGINS",
        ["http://localhost:5173", "http://127.0.0.1:5173"],
    ),
    *[
        normalize_origin(origin)
        for origin in env_list("FRONTEND_URL", [])
    ],
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = append_unique(
    env_origins("CSRF_TRUSTED_ORIGINS", []),
    origin_from_domain(os.getenv("RAILWAY_PUBLIC_DOMAIN")),
    *[
        normalize_origin(origin)
        for origin in env_list("FRONTEND_URL", [])
    ],
)

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", not DEBUG)
SECURE_REDIRECT_EXEMPT = [r"^health/$"]
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0" if DEBUG else "60"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", False)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}
