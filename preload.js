const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileAPI', {
  getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  getParentDir: (path) => ipcRenderer.invoke('get-parent-dir', path),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  getFileIconType: (fileName, isDirectory) => ipcRenderer.invoke('get-file-icon-type', fileName, isDirectory),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  getFileStats: (path) => ipcRenderer.invoke('get-file-stats', path),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('rename-item', oldPath, newPath),
  trashItem: (path) => ipcRenderer.invoke('trash-item', path),
  copyItem: (src, dest) => ipcRenderer.invoke('copy-item', src, dest),
  moveItem: (src, dest) => ipcRenderer.invoke('move-item', src, dest)
});
