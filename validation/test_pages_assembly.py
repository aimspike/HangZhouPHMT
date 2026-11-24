"""Ensure development deployments cannot replace the release viewer."""

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / 'scripts' / 'assemble_pages.py'
SPEC = importlib.util.spec_from_file_location('assemble_pages', MODULE)
PAGES = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PAGES)


class PagesAssemblyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.release = self.root / 'release'
        self.main = self.root / 'main'
        self.output = self.root / 'site'
        for checkout, label in ((self.release, 'stable'), (self.main, 'development')):
            docs = checkout / 'docs'
            (docs / 'plans').mkdir(parents=True)
            (docs / 'index.html').write_text(
                f'<head><title>{label}</title></head><body>{label}<svg><title>Fallback plan</title></svg><script>const prefix=\'house89a.settings.v1.\';</script></body>',
                encoding='utf-8'
            )
            (docs / 'plans' / 'plan.svg').write_text(label, encoding='utf-8')
            (checkout / 'private-source.txt').write_text('not public', encoding='utf-8')

    def assemble(self):
        PAGES.assemble_site(self.release, self.main, self.output, 'a' * 40, 'b' * 40)

    def test_release_bytes_and_preview_assets_are_separate(self):
        self.assemble()
        self.assertEqual((self.output / 'index.html').read_bytes(), (self.release / 'docs/index.html').read_bytes())
        self.assertEqual((self.output / 'plans/plan.svg').read_text(), 'stable')
        preview = self.output / 'preview/main'
        self.assertEqual((preview / 'plans/plan.svg').read_text(), 'development')
        self.assertIn('house89a.preview.main.settings.v1.', (preview / 'index.html').read_text(encoding='utf-8'))
        self.assertIn('[main 测试]', (preview / 'index.html').read_text(encoding='utf-8'))
        self.assertIn('<svg><title>Fallback plan</title></svg>', (preview / 'index.html').read_text(encoding='utf-8'))
        self.assertIn('noindex, nofollow', (preview / 'index.html').read_text(encoding='utf-8'))
        self.assertEqual(json.loads((self.output / 'deployment.json').read_text()), {'branch': 'release', 'commit': 'a' * 40})
        self.assertEqual(json.loads((preview / 'deployment.json').read_text()), {'branch': 'main', 'commit': 'b' * 40})
        self.assertFalse(any(self.output.rglob('private-source.txt')))

    def test_main_change_does_not_change_release(self):
        self.assemble()
        stable = (self.output / 'index.html').read_bytes()
        main_html = self.main / 'docs/index.html'
        main_html.write_text(main_html.read_text().replace('development', 'next feature'))
        second_output = self.root / 'site-next'
        PAGES.assemble_site(self.release, self.main, second_output, 'a' * 40, 'c' * 40)
        self.assertEqual((second_output / 'index.html').read_bytes(), stable)
        self.assertIn('next feature', (second_output / 'preview/main/index.html').read_text(encoding='utf-8'))

    def test_missing_release_fails_without_publishing_main_as_stable(self):
        (self.release / 'docs/index.html').unlink()
        with self.assertRaises(ValueError):
            self.assemble()
        self.assertFalse(self.output.exists())

    def test_changed_storage_marker_fails_before_creating_output(self):
        (self.main / 'docs/index.html').write_text('<title>new</title>')
        with self.assertRaises(ValueError):
            self.assemble()
        self.assertFalse(self.output.exists())

    def test_source_and_existing_output_are_protected(self):
        with self.assertRaises(ValueError):
            PAGES.assemble_site(self.release, self.main, self.release, 'a' * 40, 'b' * 40)
        self.output.mkdir()
        (self.output / 'keep.txt').write_text('keep')
        with self.assertRaises(FileExistsError):
            self.assemble()
        self.assertEqual((self.output / 'keep.txt').read_text(), 'keep')

    def test_reserved_preview_path_fails(self):
        (self.release / 'docs/preview').mkdir()
        with self.assertRaises(ValueError):
            self.assemble()
        self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
