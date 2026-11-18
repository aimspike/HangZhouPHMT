"""Rebuild morning/noon/dusk direct and indirect solar light maps."""
from pathlib import Path
from runpy import run_path

if __name__ == '__main__':
    run_path(str(Path(__file__).with_name('solar_bake.py')), run_name='__main__')
    run_path(str(Path(__file__).with_name('sky_bake.py')), run_name='__main__')
