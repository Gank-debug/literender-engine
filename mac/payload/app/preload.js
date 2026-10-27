// The only bridge between the viewer page and the desktop shell. The page has
// no Node access; it gets these few calls, all handled in main.js.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lrDesktop', {
  isDesktop: true,
  platform: process.platform,
  info: () => ipcRenderer.invoke('lr:info'),
  // which modelling programs are running (a real process scan)
  scanHosts: () => ipcRenderer.invoke('lr:scanHosts'),
  // render saving: one dialog, then files written straight to that folder
  saveDialog: (defaultName) => ipcRenderer.invoke('lr:saveDialog', defaultName),
  writeFile: (dir, name, bytes) => ipcRenderer.invoke('lr:writeFile', dir, name, bytes),
  showInFolder: (file) => ipcRenderer.invoke('lr:showInFolder', file),
  // a .lrscene passed on the command line / dropped on LiteRender.exe
  onOpenFile: (cb) => ipcRenderer.on('lr:openFile', (_e, name, bytes) => cb(name, bytes)),
  ready: () => ipcRenderer.send('lr:ready'),
  setGpu: (pref) => ipcRenderer.invoke('lr:setGpu', pref),
  // the SketchUp extension the app installs and keeps up to date
  extStatus: () => ipcRenderer.invoke('lr:extStatus'),
  extInstall: () => ipcRenderer.invoke('lr:extInstall'),
  onExtChanged: (cb) => ipcRenderer.on('lr:extChanged', (_e, res) => cb(res)),
});
