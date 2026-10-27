# LiteRender engine

`lr_engine` renders LiteRender's **Photo** images: a stand-alone build of
[Cycles](https://github.com/blender/cycles) (Apache 2.0) with a small loader
(`src/lr_engine.cpp`) that reads LiteRender's exported job directly - no
Blender, no Python.

    lr_engine <job folder> [--device auto|cpu]

The job folder holds `job.json`, `scene.bin` and textures, as written by
LiteRender's `src/photo.js`; the result is `render.exr` (linear, half float).

## Build

GitHub Actions (`.github/workflows/build.yml`) builds Windows x64 and macOS
arm64 on every push, renders a test scene (`tools/make_test_job.py`) and
publishes zips and logs as a release named `engine-<run>`.

Locally (any platform): clone Cycles at `v5.2.0`, `make update` for the
precompiled libraries, then `python tools/patch_cycles.py <cycles> .` and
build Cycles as usual - the `lr_engine` target is added next to `cycles`.

Licences: see LICENSE-ENGINE.txt.
