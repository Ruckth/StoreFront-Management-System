from pathlib import Path
import os
import subprocess
import sys
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from storefront import settings


class EnvironmentSettingsTests(SimpleTestCase):
    def import_settings_with_env(self, **overrides):
        env = os.environ.copy()
        env.update(overrides)
        for key, value in list(env.items()):
            if value is None:
                env.pop(key)

        return subprocess.run(
            [
                sys.executable,
                "-c",
                (
                    "from storefront import settings; "
                    "print(settings.DEBUG); "
                    "print(settings.SECURE_SSL_REDIRECT); "
                    "print(settings.SESSION_COOKIE_SECURE); "
                    "print(settings.CSRF_COOKIE_SECURE); "
                    "print(settings.DATABASES['default']['NAME']); "
                    "print(','.join(settings.CORS_ALLOWED_ORIGINS)); "
                    "print(','.join(settings.CSRF_TRUSTED_ORIGINS))"
                ),
            ],
            cwd=settings.BASE_DIR,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_env_bool_uses_default_when_unset(self):
        with patch.dict("os.environ", {}, clear=True):
            self.assertTrue(settings.env_bool("STORE_FRONT_MISSING_BOOL", True))
            self.assertFalse(settings.env_bool("STORE_FRONT_MISSING_BOOL", False))

    def test_env_bool_accepts_truthy_values(self):
        for value in ("1", "true", "yes", "on"):
            with self.subTest(value=value), patch.dict(
                "os.environ",
                {"STORE_FRONT_TEST_BOOL": value},
                clear=True,
            ):
                self.assertTrue(settings.env_bool("STORE_FRONT_TEST_BOOL"))

    def test_env_list_splits_and_trims_values(self):
        with patch.dict(
            "os.environ",
            {"STORE_FRONT_TEST_LIST": "localhost, example.com, ,api.example.com"},
            clear=True,
        ):
            self.assertEqual(
                settings.env_list("STORE_FRONT_TEST_LIST", []),
                ["localhost", "example.com", "api.example.com"],
            )

    def test_database_from_url_accepts_postgres_url(self):
        config = settings.database_from_url(
            "postgres://user:pass@db.example.com:5433/storefront"
        )

        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(config["NAME"], "storefront")
        self.assertEqual(config["USER"], "user")
        self.assertEqual(config["PASSWORD"], "pass")
        self.assertEqual(config["HOST"], "db.example.com")
        self.assertEqual(config["PORT"], "5433")

    def test_database_from_url_rejects_unsupported_scheme(self):
        with self.assertRaises(ImproperlyConfigured):
            settings.database_from_url("mysql://user:pass@db.example.com/storefront")

    def test_production_import_requires_secret_key(self):
        result = self.import_settings_with_env(
            DEBUG="False",
            SECRET_KEY=None,
            DATABASE_URL=None,
            PGDATABASE=None,
            PGUSER=None,
            PGHOST=None,
            RAILWAY_ENVIRONMENT_NAME=None,
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SECRET_KEY must be set", result.stderr)

    def test_production_import_enables_secure_defaults_and_database_url(self):
        result = self.import_settings_with_env(
            DEBUG="False",
            SECRET_KEY="production-secret",
            DATABASE_URL="postgres://user:pass@db.example.com:5433/storefront",
            CORS_ALLOWED_ORIGINS="https://shop.example.com",
            CSRF_TRUSTED_ORIGINS="https://api.example.com",
            FRONTEND_URL="https://frontend.example.com/app",
            RAILWAY_ENVIRONMENT_NAME=None,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        lines = result.stdout.splitlines()
        self.assertEqual(lines[0], "False")
        self.assertEqual(lines[1], "True")
        self.assertEqual(lines[2], "True")
        self.assertEqual(lines[3], "True")
        self.assertEqual(lines[4], "storefront")
        self.assertEqual(
            lines[5],
            "https://shop.example.com,https://frontend.example.com",
        )
        self.assertEqual(
            lines[6],
            "https://api.example.com,https://frontend.example.com",
        )


class MediaSettingsTests(SimpleTestCase):
    def test_media_root_defaults_to_local_media_directory(self):
        self.assertEqual(settings.default_media_root(None), settings.BASE_DIR / "media")

    def test_media_root_uses_railway_volume_when_available(self):
        self.assertEqual(settings.default_media_root("/data"), Path("/data/media"))

    def test_railway_serves_media_by_default(self):
        self.assertTrue(settings.should_serve_media_files(False, True, None))

    def test_debug_serves_media_by_default(self):
        self.assertTrue(settings.should_serve_media_files(True, False, None))

    def test_non_railway_production_requires_debug_or_volume_for_media_default(self):
        self.assertFalse(settings.should_serve_media_files(False, False, None))

    def test_volume_mount_serves_media_by_default(self):
        self.assertTrue(settings.should_serve_media_files(False, False, "/data"))
