from pathlib import Path

from django.test import SimpleTestCase

from storefront import settings


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
