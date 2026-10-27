// Installs, updates and cleans up the LiteRender SketchUp extension, so the
// user never handles an .rbz. Plain Node (no Electron), so it can be tested alone.
//
// Where SketchUp loads extensions from (per user, per SketchUp version):
//   Windows  %APPDATA%\SketchUp\SketchUp 2026\SketchUp\Plugins
//   Mac      ~/Library/Application Support/SketchUp 2026/SketchUp/Plugins
// Installing an .rbz just unzips into that folder, so copying the same files
// there is the same thing. Nothing else on the machine is touched.
//
// Safety rules:
//  * only folders/files whose CONTENT identifies them as this extension are
//    ever replaced or deleted (never by name alone)
//  * updates are staged next to the old copy and swapped in with renames, so
//    a failed copy can't leave SketchUp with half an extension
//  * never downgrades a newer version someone installed by hand
//  * a folder that can't be deleted right now (Windows file lock) is left
//    renamed as *.lr-old and removed on the next run
const fs = require('fs');
const path = require('path');
const os = require('os');

const MAIN_RB = 'literender.rb';
const DIR = 'literender';
const SIG = /module\s+LiteRender\b/;            // in every file of ours that matters
const ID = /PLUGIN_ID\s*=\s*['"]literender['"]/; // the loader file

function pluginRoots() {
  if (process.env.LR_SU_PLUGIN_ROOTS) { // tests / unusual setups: "2026=/path;2024=/path"
    return process.env.LR_SU_PLUGIN_ROOTS.split(';').filter(Boolean).map((s) => {
      const [ver, dir] = s.split('=');
      return { version: ver, dir };
    });
  }
  let base;
  if (process.platform === 'win32') base = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'SketchUp');
  else if (process.platform === 'darwin') base = path.join(os.homedir(), 'Library', 'Application Support');
  else return [];
  let names = [];
  try { names = fs.readdirSync(base); } catch (e) { return []; }
  return names
    .map((n) => n.match(/^SketchUp (20\d\d)$/))
    .filter(Boolean)
    .map((m) => ({ version: m[1], dir: path.join(base, m[0], 'SketchUp', 'Plugins') }))
    // SketchUp makes the Plugins folder on first run; a version folder without it hasn't been used
    .filter((r) => { try { return fs.statSync(path.dirname(r.dir)).isDirectory(); } catch (e) { return false; } })
    .sort((a, b) => b.version.localeCompare(a.version));
}

const read = (f, n = 4096) => {
  try {
    const fd = fs.openSync(f, 'r');
    const b = Buffer.alloc(n);
    const k = fs.readSync(fd, b, 0, n, 0);
    fs.closeSync(fd);
    return b.slice(0, k).toString('utf8');
  } catch (e) { return ''; }
};
const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } };
const isDir = (f) => { try { return fs.statSync(f).isDirectory(); } catch (e) { return false; } };

function versionOf(loaderFile) {
  const m = read(loaderFile).match(/VERSION\s*=\s*['"]([\d.]+)['"]/);
  return m ? m[1] : null;
}
function cmp(a, b) {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
  return 0;
}
// a loader .rb of ours: registers PLUGIN_ID 'literender' inside module LiteRender
const isOurLoader = (f) => { const t = read(f); return SIG.test(t) && ID.test(t); };
// an extension folder of ours: has main.rb / link.rb with module LiteRender
const isOurDir = (d) => isDir(d) && ['main.rb', 'link.rb'].some((f) => SIG.test(read(path.join(d, f))));

/** What's in one Plugins folder. */
function inspect(root) {
  const r = { sketchup: root.version, dir: root.dir, installed: null, extras: [] };
  if (!isDir(root.dir)) return r;
  const loader = path.join(root.dir, MAIN_RB);
  if (isFile(loader) && isOurLoader(loader) && isOurDir(path.join(root.dir, DIR))) r.installed = versionOf(loader);
  else if (isFile(loader) && isOurLoader(loader)) r.broken = true; // loader without its folder
  for (const n of fs.readdirSync(root.dir)) {
    if (n === MAIN_RB || n === DIR) continue;
    const p = path.join(root.dir, n);
    // copies under other names: "literender (1).rb", "LiteRender_old/", leftovers from updates
    if (n.endsWith('.lr-old') || n.endsWith('.lr-new')) { r.extras.push({ path: p, why: 'left over from an update' }); continue; }
    if (/\.rb$/i.test(n) && isFile(p) && isOurLoader(p)) r.extras.push({ path: p, why: `second LiteRender loader${versionOf(p) ? ' (v' + versionOf(p) + ')' : ''}` });
    else if (isDir(p) && /literender/i.test(n) && isOurDir(p)) r.extras.push({ path: p, why: 'old LiteRender folder' });
  }
  return r;
}

function status(bundled) {
  return pluginRoots().map((root) => {
    const r = inspect(root);
    r.bundled = bundled;
    r.state = !r.installed ? (r.broken ? 'broken' : 'missing')
      : cmp(r.installed, bundled) < 0 ? 'outdated'
      : cmp(r.installed, bundled) > 0 ? 'newer' : 'current';
    return r;
  });
}

function rm(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); return true; } catch (e) { return false; }
}
// delete now, or (if Windows has it locked) rename it out of the way for next time
function retire(p) {
  if (rm(p)) return 'removed';
  const old = p + '.' + Date.now() + '.lr-old';
  try { fs.renameSync(p, old); rm(old); return 'set aside'; } catch (e) { return 'failed'; }
}

/** Remove extra copies and update leftovers in every Plugins folder. */
function cleanup() {
  const done = [];
  for (const root of pluginRoots()) {
    for (const x of inspect(root).extras) done.push({ sketchup: root.version, path: x.path, why: x.why, result: retire(x.path) });
  }
  return done;
}

/**
 * Install or update from `srcDir` (holds literender.rb + literender/) into every
 * SketchUp version found (or just `only`). Returns a report per version.
 */
function install(srcDir, { only = null, force = false, appPath = null } = {}) {
  const bundled = versionOf(path.join(srcDir, MAIN_RB));
  if (!bundled) throw new Error('bundled extension not found');
  const report = [];
  for (const root of pluginRoots()) {
    if (only && !only.includes(root.version)) continue;
    const before = inspect(root);
    const entry = { sketchup: root.version, dir: root.dir, from: before.installed, to: bundled };
    try {
      if (before.installed && !force && cmp(before.installed, bundled) >= 0) {
        entry.result = cmp(before.installed, bundled) > 0 ? 'kept newer' : 'up to date';
      } else {
        fs.mkdirSync(root.dir, { recursive: true });
        const dest = path.join(root.dir, DIR), loader = path.join(root.dir, MAIN_RB);
        // a "literender" folder or loader that ISN'T ours: don't touch it
        if ((isDir(dest) && !isOurDir(dest)) || (isFile(loader) && !isOurLoader(loader))) throw new Error('a different "literender" is in the Plugins folder; left alone');
        const stage = dest + '.lr-new';
        rm(stage);
        fs.cpSync(path.join(srcDir, DIR), stage, { recursive: true, filter: (s) => !/[\\/]html[\\/]link([\\/]|$)/.test(s) });
        if (appPath) fs.writeFileSync(path.join(stage, 'desktop_app.txt'), appPath);
        const loaderNew = loader + '.lr-new';
        fs.copyFileSync(path.join(srcDir, MAIN_RB), loaderNew);
        // swap: old aside, new in, then drop the old
        let aside = null;
        if (isDir(dest)) { aside = dest + '.' + Date.now() + '.lr-old'; fs.renameSync(dest, aside); }
        try { fs.renameSync(stage, dest); } catch (e) { if (aside) fs.renameSync(aside, dest); throw e; }
        fs.rmSync(loader, { force: true });
        fs.renameSync(loaderNew, loader);
        if (aside) retire(aside);
        entry.result = before.installed ? 'updated' : 'installed';
      }
      // record where the app is, so SketchUp's "Open LiteRender App" can start it
      if (appPath && entry.result !== 'kept newer') { try { fs.writeFileSync(path.join(root.dir, DIR, 'desktop_app.txt'), appPath); } catch (e) { /* fine */ } }
    } catch (e) { entry.result = 'failed'; entry.error = e.message; }
    report.push(entry);
  }
  return { bundled, report, cleaned: cleanup() };
}

/** Remove the extension (and any extra copies) from every SketchUp version found. */
function uninstall({ only = null } = {}) {
  const report = [];
  for (const root of pluginRoots()) {
    if (only && !only.includes(root.version)) continue;
    const r = inspect(root);
    const loader = path.join(root.dir, MAIN_RB), dest = path.join(root.dir, DIR);
    const out = { sketchup: root.version, removed: [] };
    if (isFile(loader) && isOurLoader(loader) && retire(loader) !== 'failed') out.removed.push(loader);
    if (isOurDir(dest) && retire(dest) !== 'failed') out.removed.push(dest);
    for (const x of r.extras) if (retire(x.path) !== 'failed') out.removed.push(x.path);
    report.push(out);
  }
  return report;
}

module.exports = { pluginRoots, status, install, uninstall, cleanup, versionOf, cmp };
