"""Publish release at the site root and main at /preview/main/."""

import argparse
import json
from pathlib import Path
import re
import shutil


def assemble_site(release_root, main_root, output, release_sha, main_sha):
    release_docs = Path(release_root).resolve() / 'docs'
    main_docs = Path(main_root).resolve() / 'docs'
    output = Path(output).resolve()
    for docs in (release_docs, main_docs):
        if not (docs / 'index.html').is_file():
            raise ValueError(f'Missing built viewer: {docs / "index.html"}')
        if (docs / 'preview').exists():
            raise ValueError(f'Reserved deployment path already exists: {docs / "preview"}')
        if output == docs or docs in output.parents or output in docs.parents:
            raise ValueError('Output must be separate from source docs directories')
    for sha in (release_sha, main_sha):
        if not re.fullmatch(r'[0-9a-f]{40}', sha):
            raise ValueError('Deployment metadata requires full Git commit SHAs')

    preview_html = (main_docs / 'index.html').read_text(encoding='utf-8')
    storage_prefix = "prefix='house89a.settings.v1.'"
    document_head = re.search(r'<head\b[^>]*>(.*?)</head>', preview_html, re.DOTALL)
    if preview_html.count(storage_prefix) != 1 or not document_head or document_head.group(1).count('<title>') != 1:
        raise ValueError('Preview title/storage markers changed; review preview isolation before publishing')
    preview_html = preview_html.replace(storage_prefix, "prefix='house89a.preview.main.settings.v1.'")
    preview_html = preview_html.replace('<title>', '<meta name="robots" content="noindex, nofollow">\n<title>[main 测试] ', 1)

    # copytree refuses an existing output: never clean or overwrite a source tree.
    shutil.copytree(release_docs, output)
    preview = output / 'preview' / 'main'
    shutil.copytree(main_docs, preview)
    (preview / 'index.html').write_text(preview_html, encoding='utf-8', newline='\n')
    (output / '.nojekyll').touch()
    for destination, branch, commit in ((output, 'release', release_sha), (preview, 'main', main_sha)):
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
    args = parser.parse_args()
    assemble_site(args.release_root, args.main_root, args.output, args.release_sha, args.main_sha)
