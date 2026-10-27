// LiteRender desktop app (Electron main process).
//
// The window shows the same viewer as the browser app (viewer/LiteRender.html,
// fully offline). What the desktop shell adds:
//  * portable: everything it stores (settings, materials, caches) lives in
//    "LiteRender data" next to LiteRender.exe; nothing is installed, no
//    registry entries, nothing written elsewhere (Mac: ~/Library/Application Support)
//  * asks Windows for the high-performance GPU (a web page can't)
//  * a real process scan for SketchUp (and other modellers), so the app can say
//    "SketchUp is open but the LiteRender extension isn't answering"
//  * renders written straight to a folder (one dialog, also for batch renders)
//  * open a .lrscene by dropping it on LiteRender.exe / passing it on the command line
//  * installs / updates / cleans up the SketchUp extension itself (sketchup.js), so no .rbz
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, spawn } = require('child_process');
const su = require('./sketchup');

// the extension files shipped inside the app (same as the .rbz)
const EXT_SRC = path.join(__dirname, 'extension');
const bundledExt = () => su.versionOf(path.join(EXT_SRC, 'literender.rb'));
// what SketchUp's "Open LiteRender App" should start
const appPath = () => (process.platform === 'darwin' ? path.resolve(process.execPath, '../../..') : process.execPath);
let extReport = null;

// ------------------------------------------------------------ Blender (Photo renders)
// Blender isn't bundled (≈400 MB, and blender.org is the place to get it). The
// app finds it: a location chosen in the menu, a portable Blender unzipped
// into the LiteRender folder, or a normal Blender install.
function blenderCandidates() {
  const out = [];
  if (prefs.blenderPath) out.push(prefs.blenderPath);
  const exeDir = path.dirname(process.execPath);
  const sub = (dir, exe) => { try { for (const n of fs.readdirSync(dir).sort().reverse()) if (/^blender/i.test(n)) out.push(path.join(dir, n, exe)); } catch (e) { /* none */ } };
  if (process.platform === 'win32') {
    sub(exeDir, 'blender.exe');
    sub(path.join(exeDir, 'blender'), 'blender.exe');
    out.push(path.join(exeDir, 'blender', 'blender.exe'));
    for (const root of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs')].filter(Boolean)) sub(path.join(root, 'Blender Foundation'), 'blender.exe');
  } else if (process.platform === 'darwin') {
    out.push('/Applications/Blender.app/Contents/MacOS/Blender', path.join(require('os').homedir(), 'Applications/Blender.app/Contents/MacOS/Blender'));
  } else {
    sub(exeDir, 'blender');
    out.push('/usr/bin/blender', '/usr/local/bin/blender', '/snap/bin/blender');
  }
  return out;
}
// The built-in engine: Blender's Cycles packaged with the app (portable Python +
// Blender as a Python module, stripped to what rendering needs). Nothing to install.
function builtInEngine() {
  const roots = [path.join(path.dirname(process.execPath), 'engine'), path.join(process.resourcesPath || '', 'engine')];
  for (const r of roots) {
    // LiteRender's own Cycles build (lr_engine), when present
    const native = path.join(r, process.platform === 'win32' ? 'lr_engine.exe' : 'lr_engine');
    try { if (fs.statSync(native).isFile()) return { cmd: native, native: true, builtIn: true }; } catch (e) { /* next */ }
    const py = process.platform === 'win32' ? path.join(r, 'python', 'python.exe') : path.join(r, 'python', 'bin', 'python3');
    try { if (fs.statSync(py).isFile()) return { cmd: py, module: true, builtIn: true }; } catch (e) { /* next */ }
  }
  return null;
}
function findBlender() {
  if (process.env.LR_BLENDER_CMD) return { cmd: process.env.LR_BLENDER_CMD, test: true };
  const own = builtInEngine();
  if (own) return own;
  for (const f of blenderCandidates()) { try { if (fs.statSync(f).isFile()) return { cmd: f }; } catch (e) { /* next */ } }
  return null;
}
let photoProc = null; // what the start-up check did, shown in the page once it's ready

// ------------------------------------------------------------ portable data
function portableDir() {
  if (process.platform === 'darwin') return null; // inside a signed .app bundle: use the normal place
  const dir = path.join(path.dirname(process.execPath), 'LiteRender data');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch (e) { return null; }
}
const dataDir = portableDir();
if (dataDir) {
  app.setPath('userData', dataDir);
  app.setPath('sessionData', dataDir);
  try { app.setPath('crashDumps', path.join(dataDir, 'Crashpad')); } catch (e) { /* older Electron */ }
}

const prefsFile = () => path.join(app.getPath('userData'), 'prefs.json');
let prefs = { gpu: 'high', lastDir: null, win: null };
try { prefs = Object.assign(prefs, JSON.parse(fs.readFileSync(prefsFile(), 'utf8'))); } catch (e) { /* first run */ }
const savePrefs = () => { try { fs.writeFileSync(prefsFile(), JSON.stringify(prefs, null, 1)); } catch (e) { /* read-only */ } };

// ------------------------------------------------------------ GPU
// Laptops with Intel + NVIDIA/AMD: ask for the discrete GPU. Must be set before
// the GPU process starts, so changing it relaunches the app.
if (prefs.gpu === 'high') app.commandLine.appendSwitch('force_high_performance_gpu');
else if (prefs.gpu === 'low') app.commandLine.appendSwitch('force_low_power_gpu');
// The app talks to SketchUp on 127.0.0.1; don't let Chromium's local-network
// permission (meant for websites) block or prompt for that.
app.commandLine.appendSwitch('disable-features', 'LocalNetworkAccessChecks');

// ------------------------------------------------------------ single window
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
let pendingFile = null;
let pageReady = false;
const allowedDirs = new Set();

function sceneArg(argv) {
  for (const a of argv.slice(1)) {
    if (/\.lrscene$/i.test(a)) {
      try { if (fs.statSync(a).isFile()) return a; } catch (e) { /* not a file */ }
    }
  }
  return null;
}

function sendFile(file) {
  if (!file) return;
  if (!win || !pageReady) { pendingFile = file; return; }
  try {
    const bytes = fs.readFileSync(file);
    win.webContents.send('lr:openFile', path.basename(file), new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length));
  } catch (e) {
    dialog.showErrorBox('LiteRender', `Could not read ${file}:\n${e.message}`);
  }
}

function createWindow() {
  const b = prefs.win || { width: 1500, height: 940 };
  win = new BrowserWindow({
    width: b.width, height: b.height, x: b.x, y: b.y,
    minWidth: 900, minHeight: 560,
    title: 'LiteRender',
    backgroundColor: '#efebe6',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false, // keep rendering a batch while minimised
      spellcheck: false,
    },
  });
  if (b.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  const remember = () => {
    if (!win || win.isMinimized()) return;
    prefs.win = Object.assign(win.isMaximized() ? (prefs.win || {}) : win.getBounds(), { max: win.isMaximized() });
    savePrefs();
  };
  win.on('close', remember);
  win.on('closed', () => { win = null; });
  win.loadFile(path.join(__dirname, 'viewer', 'LiteRender.html'));
}

// ------------------------------------------------------------ menu
function buildMenu() {
  const mac = process.platform === 'darwin';
  const gpuItem = (label, val) => ({ label, type: 'radio', checked: prefs.gpu === val, click: () => setGpu(val) });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(mac ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [
      { label: 'Open .lrscene…', accelerator: 'CmdOrCtrl+O', click: async () => {
        const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'LiteRender scene', extensions: ['lrscene'] }] });
        if (!r.canceled && r.filePaths[0]) sendFile(r.filePaths[0]);
      } },
      { type: 'separator' },
      mac ? { role: 'close' } : { role: 'quit' },
    ] },
    { role: 'editMenu' },
    { label: 'View', submenu: [
      { role: 'reload' }, { role: 'toggleDevTools', accelerator: 'F12' }, { type: 'separator' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' },
    ] },
    { label: 'SketchUp', submenu: [
      { label: 'Install / update the SketchUp extension', click: () => menuInstall() },
      { label: 'Remove the extension from SketchUp…', click: () => menuRemove() },
      { type: 'separator' },
      { type: 'separator' },
      { label: 'Locate Blender (for Photo renders)…', click: async () => {
        const r = await dialog.showOpenDialog(win, { title: 'Locate Blender', properties: ['openFile'] });
        if (!r.canceled && r.filePaths[0]) { prefs.blenderPath = r.filePaths[0]; savePrefs(); }
      } },
      { label: 'Show SketchUp Plugins folder', click: () => { const r = su.pluginRoots()[0]; if (r) shell.openPath(r.dir); } },
    ] },
    { label: 'Graphics', submenu: [
      gpuItem('High-performance GPU (recommended)', 'high'),
      gpuItem('Power-saving GPU', 'low'),
      gpuItem('Let Windows decide', 'auto'),
      { type: 'separator' },
      { label: 'GPU report…', click: () => { const w = new BrowserWindow({ width: 900, height: 700, title: 'GPU report', autoHideMenuBar: true }); w.loadURL('chrome://gpu'); } },
    ] },
    { label: 'Help', submenu: [
      { label: 'Open data folder', click: () => shell.openPath(app.getPath('userData')) },
      { label: `LiteRender ${app.getVersion()} · Electron ${process.versions.electron}`, enabled: false },
    ] },
  ]));
}

function summary(res) {
  const lines = res.report.map((e) => `SketchUp ${e.sketchup}: ${e.result}${e.result === 'updated' ? ` (${e.from} → ${e.to})` : e.result === 'installed' ? ` (${e.to})` : ''}${e.error ? ' — ' + e.error : ''}`);
  for (const c of res.cleaned) lines.push(`SketchUp ${c.sketchup}: ${c.result} ${path.basename(c.path)} (${c.why})`);
  return lines;
}

function extInstall(only) {
  const res = su.install(EXT_SRC, { only, appPath: appPath() });
  res.changed = res.report.some((e) => e.result === 'installed' || e.result === 'updated') || res.cleaned.length > 0;
  res.lines = summary(res);
  return res;
}

function menuInstall() {
  if (!su.pluginRoots().length) {
    dialog.showMessageBoxSync(win, { type: 'info', message: 'No SketchUp found', detail: 'SketchUp makes its Plugins folder the first time it runs. Start SketchUp once, close it, then try again.' });
    return;
  }
  const res = extInstall(null);
  dialog.showMessageBoxSync(win, { type: res.report.some((e) => e.result === 'failed') ? 'warning' : 'info',
    message: res.changed ? 'SketchUp extension set up. Restart SketchUp to load it.' : 'The SketchUp extension is already up to date.',
    detail: res.lines.join('\n') });
  if (win) win.webContents.send('lr:extChanged', res);
}

function menuRemove() {
  const st = su.status(bundledExt()).filter((r) => r.installed || r.extras.length);
  if (!st.length) { dialog.showMessageBoxSync(win, { message: 'LiteRender is not installed in any SketchUp.' }); return; }
  const r = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Remove', 'Cancel'], defaultId: 1, cancelId: 1,
    message: 'Remove the LiteRender extension from SketchUp?',
    detail: st.map((x) => `SketchUp ${x.sketchup}: ${x.installed ? 'v' + x.installed : ''}${x.extras.length ? ` + ${x.extras.length} old cop${x.extras.length > 1 ? 'ies' : 'y'}` : ''}`).join('\n') + '\n\nLive sync stops working until it is installed again (SketchUp menu).' });
  if (r !== 0) return;
  const out = su.uninstall();
  dialog.showMessageBoxSync(win, { message: 'Removed. Restart SketchUp to unload it.', detail: out.map((o) => `SketchUp ${o.sketchup}: ${o.removed.length} item(s) removed`).join('\n') });
  if (win) win.webContents.send('lr:extChanged', { lines: [] });
}

// Start-up: where the extension is already installed, bring it up to this
// app's version, and clear out old copies. A first install is the user's call.
function maintainExtension() {
  try {
    const st = su.status(bundledExt());
    const have = st.filter((r) => r.installed || r.broken).map((r) => r.sketchup);
    const res = have.length ? extInstall(have) : Object.assign({ report: [], cleaned: su.cleanup() }, {});
    if (!res.lines) { res.lines = summary(res); res.changed = res.cleaned.length > 0; }
    if (res.changed) extReport = res;
  } catch (e) { console.error('extension check failed', e); }
}

function setGpu(val) {
  if (prefs.gpu === val) return;
  prefs.gpu = val;
  savePrefs();
  const r = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Restart now', 'Later'], defaultId: 0, message: 'The graphics setting applies after LiteRender restarts.' });
  if (r === 0) { app.relaunch(); app.exit(0); }
  buildMenu();
}

// ------------------------------------------------------------ process scan
const HOSTS = [
  { name: 'SketchUp', re: /^sketchup(\.exe)?$/i },
  { name: 'Archicad', re: /^archicad(\.exe)?$/i },
  { name: 'Revit', re: /^revit(\.exe)?$/i },
  { name: 'Rhino', re: /^rhino(\d*)?(\.exe)?$/i },
];
function processNames() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      execFile('tasklist', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 8000, maxBuffer: 8 << 20 }, (err, out) => {
        if (err) return resolve(null);
        resolve(out.split(/\r?\n/).map((l) => (l.match(/^"([^"]+)"/) || [])[1]).filter(Boolean));
      });
    } else {
      execFile('ps', ['-axco', 'comm'], { timeout: 8000, maxBuffer: 8 << 20 }, (err, out) => {
        if (err) return resolve(null);
        resolve(out.split('\n').map((s) => s.trim()).filter(Boolean));
      });
    }
  });
}

// ------------------------------------------------------------ IPC
ipcMain.handle('lr:info', () => ({
  version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome,
  platform: process.platform, gpu: prefs.gpu, dataDir: app.getPath('userData'),
}));

ipcMain.handle('lr:scanHosts', async () => {
  const names = await processNames();
  if (!names) return null; // scan not possible (blocked): the page relies on the port check alone
  return HOSTS.map((h) => ({ name: h.name, running: names.some((n) => h.re.test(n)) })).filter((h) => h.running);
});

ipcMain.handle('lr:saveDialog', async (_e, defaultName) => {
  const name = path.basename(String(defaultName || 'render.png'));
  const dir = prefs.lastDir && fs.existsSync(prefs.lastDir) ? prefs.lastDir : app.getPath('pictures');
  const r = await dialog.showSaveDialog(win, {
    title: 'Save render', defaultPath: path.join(dir, name),
    filters: [{ name: 'PNG image', extensions: ['png'] }],
  });
  if (r.canceled || !r.filePath) return null;
  const outDir = path.dirname(r.filePath);
  prefs.lastDir = outDir; savePrefs();
  allowedDirs.add(outDir);
  return { dir: outDir, base: path.basename(r.filePath).replace(/\.png$/i, '') };
});

// Only into a folder the user picked in this session, only a plain file name.
ipcMain.handle('lr:writeFile', async (_e, dir, name, bytes) => {
  if (!allowedDirs.has(dir)) throw new Error('folder was not chosen in a save dialog');
  const n = String(name);
  if (!n || /[\\/]/.test(n) || n === '.' || n === '..') throw new Error('bad file name');
  const file = path.join(dir, n.replace(/[<>:"|?*\x00-\x1f]/g, '_'));
  await fs.promises.writeFile(file, Buffer.from(bytes));
  return file;
});

ipcMain.handle('lr:showInFolder', (_e, file) => {
  if (file && allowedDirs.has(path.dirname(file))) shell.showItemInFolder(file);
});

ipcMain.handle('lr:setGpu', (_e, val) => { if (['high', 'low', 'auto'].includes(val)) setGpu(val); return prefs.gpu; });

ipcMain.handle('lr:blenderInfo', () => { const b = findBlender(); return b ? { path: b.cmd, builtIn: !!b.builtIn } : null; });

ipcMain.handle('lr:locateBlender', async () => {
  const mac = process.platform === 'darwin';
  const r = await dialog.showOpenDialog(win, {
    title: 'Locate Blender', properties: ['openFile'],
    filters: mac ? [] : process.platform === 'win32' ? [{ name: 'Blender', extensions: ['exe'] }] : [],
    defaultPath: mac ? '/Applications' : undefined,
  });
  if (r.canceled || !r.filePaths[0]) return null;
  let f = r.filePaths[0];
  if (mac && f.endsWith('.app')) f = path.join(f, 'Contents', 'MacOS', 'Blender');
  if (!/blender/i.test(path.basename(f))) throw new Error('That is not Blender (choose blender.exe)');
  prefs.blenderPath = f; savePrefs();
  return { path: f };
});

// Render a Photo: write the job, run Blender's Cycles on it, stream progress, return the EXR.
ipcMain.handle('lr:photoRender', async (e, job) => {
  const b = findBlender();
  if (!b) { const err = new Error('NO_BLENDER'); throw err; }
  if (photoProc) throw new Error('A Photo render is already running');
  const dir = path.join(app.getPath('userData'), 'photo', String(Date.now()));
  fs.mkdirSync(dir, { recursive: true });
  try {
    fs.writeFileSync(path.join(dir, 'job.json'), job.json);
    fs.writeFileSync(path.join(dir, 'scene.bin'), Buffer.from(job.bin));
    for (const f of job.files || []) {
      if (/[\\/]/.test(f.name)) throw new Error('bad texture name');
      fs.writeFileSync(path.join(dir, f.name), Buffer.from(f.bytes));
    }
    const script = path.join(__dirname, 'cycles', 'lr_cycles.py');
    const [cmd, ...pre] = b.test ? b.cmd.split(' ') : [b.cmd];
    // built-in engine: isolated Python (-I: ignores any Python setup on the machine)
    const args = b.test ? [...pre, dir] : b.native ? [dir] : b.module ? ['-I', '-B', script, dir] : ['-b', '--factory-startup', '--python', script, '--', dir];
    let t0s = 0, s0 = 0;
    const send = (p) => { if (!e.sender.isDestroyed()) e.sender.send('lr:photoProgress', p); };
    send({ text: 'Starting the render engine…', frac: 0 });
    const log = [];
    const code = await new Promise((resolve, reject) => {
      photoProc = spawn(cmd, args, { cwd: dir, windowsHide: true, env: Object.assign({}, process.env, { PYTHONUNBUFFERED: '1' }) });
      let buf = '';
      const onData = (d) => {
        buf += d.toString();
        let i;
        while ((i = buf.search(/[\r\n]/)) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line) continue;
          log.push(line); if (log.length > 200) log.shift();
          let m;
          if ((m = line.match(/\[LR\] device (.*)/))) send({ text: 'Cycles on ' + m[1], device: m[1], frac: 0.02 });
          else if (/\[LR\] materials/.test(line)) send({ text: 'Building materials…', frac: 0.03 });
          else if (/\[LR\] geometry/.test(line)) send({ text: 'Building the scene…', frac: 0.05 });
          else if ((m = line.match(/Sample (\d+)\/(\d+)/))) {
            let rem = (line.match(/Remaining:([\d:.]+)/) || [])[1];
            const done = +m[1], tot = +m[2], now = Date.now();
            if (!t0s) { t0s = now; s0 = done; }
            else if (!rem && done > s0) {
              const left = Math.round((now - t0s) / (done - s0) * (tot - done) / 1000);
              rem = left >= 60 ? `${Math.floor(left / 60)} min ${left % 60} s` : `${left} s`;
            }
            send({ text: `Path tracing · sample ${done} of ${tot}${rem ? ' · about ' + rem.replace(/\.\d+$/, '') + ' left' : ''}`, frac: 0.06 + 0.88 * (done / tot) });
          } else if (/Denoising/i.test(line)) send({ text: 'Denoising…', frac: 0.95 });
        }
      };
      photoProc.stdout.on('data', onData);
      photoProc.stderr.on('data', onData);
      photoProc.on('error', reject);
      photoProc.on('close', (c, sig) => resolve(sig ? -1 : c));
    });
    photoProc = null;
    const exr = path.join(dir, 'render.exr');
    if (code !== 0 || !fs.existsSync(exr)) {
      if (code === -1) throw new Error('CANCELLED');
      throw new Error('Blender stopped (code ' + code + '):\n' + log.filter((l) => /error|Error|Traceback|\[LR\]/.test(l)).slice(-8).join('\n'));
    }
    const bytes = fs.readFileSync(exr);
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length);
  } finally {
    photoProc = null;
    if (!process.env.LR_KEEP_JOB) fs.rmSync(dir, { recursive: true, force: true });
  }
});

ipcMain.handle('lr:photoCancel', () => { if (photoProc) { try { photoProc.kill(); } catch (e) { /* gone */ } } });

ipcMain.handle('lr:extStatus', () => ({ bundled: bundledExt(), list: su.status(bundledExt()) }));
ipcMain.handle('lr:extInstall', () => extInstall(null));

ipcMain.on('lr:ready', () => {
  pageReady = true;
  if (extReport) { win.webContents.send('lr:extChanged', extReport); extReport = null; }
  if (pendingFile) { const f = pendingFile; pendingFile = null; sendFile(f); }
});

// ------------------------------------------------------------ app lifecycle
app.on('second-instance', (_e, argv) => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  sendFile(sceneArg(argv));
});
app.on('open-file', (e, file) => { e.preventDefault(); sendFile(file); }); // Mac: drop on dock icon

app.on('web-contents-created', (_e, wc) => {
  // the viewer never navigates away; links to websites open in the real browser
  wc.on('will-navigate', (ev, url) => { if (!url.startsWith('file:')) { ev.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  wc.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
});

app.whenReady().then(() => {
  // no camera/microphone/location/notifications; storage and file pickers are fine
  const ok = new Set(['clipboard-sanitized-write', 'fullscreen', 'fileSystem', 'local-network-access', 'local-network', 'loopback-network', 'pointerLock', 'window-management']);
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(ok.has(perm)));
  session.defaultSession.setPermissionCheckHandler((_wc, perm) => ok.has(perm));
  pendingFile = sceneArg(process.argv);
  maintainExtension();
  buildMenu();
  createWindow();
});
app.on('window-all-closed', () => app.quit());
