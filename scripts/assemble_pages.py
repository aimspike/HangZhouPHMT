"""Publish release, main and optional isolated feature previews."""

import argparse
import json
from pathlib import Path
import re
import shutil


def preview_document(docs, slug, label):
    html = (docs / 'index.html').read_text(encoding='utf-8')
    marker = "prefix='house89a.settings.v1.'"
    head = re.search(r'<head\b[^>]*>(.*?)</head>', html, re.DOTALL)
    if html.count(marker) != 1 or not head or head.group(1).count('<title>') != 1:
        raise ValueError('Preview title/storage markers changed; review preview isolation before publishing')
    return html.replace(marker, f"prefix='house89a.preview.{slug}.settings.v1.'").replace(
        '<title>', f'<meta name="robots" content="noindex, nofollow">\n<title>[{label} 测试] ', 1)


def assemble_site(release_root, main_root, output, release_sha, main_sha, features=()):
    release_docs = Path(release_root).resolve() / 'docs'
    main_docs = Path(main_root).resolve() / 'docs'
    output = Path(output).resolve()
    entries = [(main_docs, 'main', 'main', main_sha)]
    for slug, checkout, commit in features:
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or slug == 'main' or any(e[1] == slug for e in entries):
            raise ValueError('Feature preview requires a unique, safe slug')
        entries.append((Path(checkout).resolve() / 'docs', slug, 'feature/' + slug, commit))
    for docs in (release_docs, *(e[0] for e in entries)):
        if not (docs / 'index.html').is_file():
            raise ValueError(f'Missing built viewer: {docs / "index.html"}')
        if (docs / 'preview').exists():
            raise ValueError(f'Reserved deployment path already exists: {docs / "preview"}')
        if output == docs or docs in output.parents or output in docs.parents:
            raise ValueError('Output must be separate from source docs directories')
    for sha in (release_sha, *(e[3] for e in entries)):
        if not re.fullmatch(r'[0-9a-f]{40}', sha):
            raise ValueError('Deployment metadata requires full Git commit SHAs')

    previews = [(docs, slug, branch, commit, preview_document(docs, slug, slug)) for docs, slug, branch, commit in entries]

    # copytree refuses an existing output: never clean or overwrite a source tree.
    shutil.copytree(release_docs, output)
    destinations = [(output, 'release', release_sha)]
    for docs, slug, branch, commit, html in previews:
        preview = output / 'preview' / slug
        shutil.copytree(docs, preview)
        (preview / 'index.html').write_text(html, encoding='utf-8', newline='\n')
        destinations.append((preview, branch, commit))
    (output / '.nojekyll').touch()
    for destination, branch, commit in destinations:
        (destination / 'deployment.json').write_text(
            json.dumps({'branch': branch, 'commit': commit}, indent=2) + '\n', encoding='utf-8'
        )


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release-root', type=Path, required=True)
    parser.add_argument('--main-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--release-sha', required=True)
    parser.add_argument('--main-sha', required=True)
    parser.add_argument('--feature', nargs=3, action='append', default=[], metavar=('SLUG', 'CHECKOUT', 'SHA'))
    args = parser.parse_args()
    assemble_site(args.release_root, args.main_root, args.output, args.release_sha, args.main_sha, args.feature)
