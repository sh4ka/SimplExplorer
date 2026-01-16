const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set dock icon on macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, 'assets', 'compass.png'));
  }

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('get-home-dir', () => {
  return os.homedir();
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const results = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      let size = 0;
      let modified = new Date();
      let created = new Date();

      try {
        const stats = await fs.promises.stat(fullPath);
        size = stats.size;
        modified = stats.mtime;
        created = stats.birthtime;
      } catch (e) {
        // Use defaults if stat fails (symlinks, permissions, etc.)
      }

      results.push({
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        isSymlink: item.isSymbolicLink(),
        size: size,
        modified: modified,
        created: created
      });
    }

    // Sort: directories first, then files, alphabetically
    results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return { success: true, items: results, path: dirPath };
  } catch (error) {
    return { success: false, error: error.message, path: dirPath };
  }
});

ipcMain.handle('get-parent-dir', (event, currentPath) => {
  return path.dirname(currentPath);
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-file-icon-type', (event, fileName, isDirectory) => {
  if (isDirectory) return 'folder';
  
  const ext = path.extname(fileName).toLowerCase();
  const iconMap = {
    // Images
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', 
    '.svg': 'image', '.webp': 'image', '.ico': 'image',
    // Documents
    '.pdf': 'pdf', '.doc': 'document', '.docx': 'document', 
    '.txt': 'text', '.md': 'text', '.rtf': 'document',
    // Code
    '.js': 'code', '.ts': 'code', '.jsx': 'code', '.tsx': 'code',
    '.html': 'code', '.css': 'code', '.scss': 'code',
    '.py': 'code', '.rb': 'code', '.php': 'code',
    '.rs': 'code', '.go': 'code', '.c': 'code', '.cpp': 'code', '.h': 'code',
    '.java': 'code', '.swift': 'code', '.kt': 'code',
    '.json': 'code', '.xml': 'code', '.yaml': 'code', '.yml': 'code',
    '.sh': 'code', '.bash': 'code', '.zsh': 'code',
    // Archives
    '.zip': 'archive', '.tar': 'archive', '.gz': 'archive', 
    '.rar': 'archive', '.7z': 'archive',
    // Media
    '.mp3': 'audio', '.wav': 'audio', '.flac': 'audio', '.aac': 'audio',
    '.mp4': 'video', '.mov': 'video', '.avi': 'video', '.mkv': 'video',
    // Apps
    '.app': 'app', '.exe': 'app', '.dmg': 'app'
  };
  
  return iconMap[ext] || 'file';
});

// Open file with default application
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get file stats
ipcMain.handle('get-file-stats', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime
    };
  } catch (error) {
    return { size: 0, created: new Date(), modified: new Date(), accessed: new Date() };
  }
});

// Rename file/folder
ipcMain.handle('rename-item', async (event, oldPath, newPath) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Move to trash
ipcMain.handle('trash-item', async (event, filePath) => {
  try {
    await shell.trashItem(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Copy file/folder
ipcMain.handle('copy-item', async (event, srcPath, destPath) => {
  try {
    const stats = await fs.promises.stat(srcPath);
    if (stats.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Move file/folder
ipcMain.handle('move-item', async (event, srcPath, destPath) => {
  try {
    await fs.promises.rename(srcPath, destPath);
    return { success: true };
  } catch (error) {
    // If rename fails (cross-device), copy then delete
    try {
      const stats = await fs.promises.stat(srcPath);
      if (stats.isDirectory()) {
        await copyDir(srcPath, destPath);
        await fs.promises.rm(srcPath, { recursive: true });
      } else {
        await fs.promises.copyFile(srcPath, destPath);
        await fs.promises.unlink(srcPath);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

// Helper: recursively copy directory
async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}
