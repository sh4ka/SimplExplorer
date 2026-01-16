# CLAUDE.md - Project Context for SimplExplorer

## Overview
SimplExplorer is a macOS file browser built with Electron. It provides a native-feeling file explorer experience with a directory tree sidebar and file list view.

## Tech Stack
- **Electron 28** - Desktop app framework
- **Node.js** - Backend file operations
- **Vanilla JavaScript** - Frontend (no frameworks)
- **electron-builder** - Packaging for macOS

## Architecture

### Main Process (`main.js`)
Handles all file system operations via IPC:
- `get-home-dir` - Returns user's home directory
- `read-directory` - Lists directory contents with file stats
- `get-parent-dir` - Returns parent path
- `open-folder-dialog` - Native folder picker
- `get-file-icon-type` - Returns icon type based on extension
- `open-file` - Opens file with default application (shell.openPath)
- `get-file-stats` - Returns file metadata
- `rename-item` - Renames files/folders
- `trash-item` - Moves to trash (shell.trashItem)
- `copy-item` - Copies files/folders (recursive for directories)
- `move-item` - Moves files/folders

### Preload Script (`preload.js`)
Exposes `window.fileAPI` to renderer via contextBridge with all IPC methods.

### Renderer (`index.html`)
Single HTML file containing all CSS and JavaScript:
- **Sidebar**: Dynamic directory tree that expands on click
- **File List**: Shows files/folders with icons, size, and date
- **Context Menu**: Right-click menu for file operations
- **Properties Modal**: Shows file information

## Features Implemented

### Directory Tree (Left Sidebar)
- Starts at root (`/`) and expands on click
- Auto-expands to home directory on startup
- Syncs with file list navigation (clicking folder on right expands tree)
- Shows only folders, expandable with arrow toggle

### File List (Right Panel)
- Shows all files and folders with icons
- Columns: name, size, modified date
- Double-click to open (files with default app, folders navigate)
- Single-click to select
- Hidden files styled with muted color

### Context Menu (Right-Click)
- **Open** - Opens file/folder
- **Cut/Copy/Paste** - Clipboard operations (⌘X, ⌘C, ⌘V)
- **Rename** - Inline editing, smart selection (excludes extension)
- **Move to Trash** - Delete with confirmation (⌘⌫)
- **Properties** - Modal with file info

### Hidden Files Toggle
- Eye button in toolbar toggles hidden files visibility
- Filters both tree and file list
- Button highlights blue when showing hidden files

### Navigation
- Back/Forward buttons with history
- Up button to parent directory
- Path bar with manual entry
- Open Folder button for native picker

## Building

```bash
# Development
npm start

# Build macOS app
npm run build
# Output: dist/file-browser-1.0.0-arm64.dmg
```

## File Structure
```
├── main.js          # Electron main process
├── preload.js       # IPC bridge to renderer
├── index.html       # UI (HTML + CSS + JS)
├── package.json     # Dependencies and scripts
├── assets/          # App icons
│   ├── compass.png  # Source icon (512x512)
│   └── icon.icns    # macOS icon
└── dist/            # Built app output
```

## Key Implementation Notes

1. **CSP**: Content Security Policy allows cdnjs.cloudflare.com for Font Awesome
2. **Icons**: Uses Font Awesome 6.5.1 (loaded from CDN) for all UI icons
3. **Async/Await**: All file operations are async; `renderFileList` must be awaited
4. **Error Handling**: IPC handlers return `{ success, error }` objects, not exceptions
5. **Tree State**: `expandedPaths` Set tracks which folders are expanded
6. **Clipboard**: Stores `{ item, action }` where action is 'copy' or 'cut'
7. **App Icon**: Compass icon from Flaticon, configured in main.js and package.json

## Git Branches
- `master` - Stable release
- `develop` - Development branch

## Claude Rules
- **NEVER commit or push unless explicitly requested by the user**
