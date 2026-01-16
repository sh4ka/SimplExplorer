# File Browser - Electron App for macOS

A minimal, dark-themed file browser built with Electron.

## Features

- 📁 Browse directories and files
- 🔙 Back/Forward navigation history
- ⬆️ Navigate to parent directory
- 🏠 Quick access sidebar (Home, Desktop, Documents, Downloads, Applications)
- 📊 File metadata (size, modification date)
- 🎨 Dark theme with macOS-style hidden titlebar
- ⌨️ Keyboard support (Backspace to go up, Enter in path bar to navigate)

## Setup

```bash
cd file-browser
npm install
```

## Run in Development

```bash
npm start
```

## Build for macOS

```bash
npm run build
```

This will create a `.app` bundle in the `dist` folder.

## Project Structure

```
file-browser/
├── package.json    # Dependencies and scripts
├── main.js         # Electron main process
├── preload.js      # Secure IPC bridge
├── index.html      # UI with embedded CSS/JS
└── README.md       # This file
```

## Requirements

- Node.js 18+
- macOS (optimized for, but should work on other platforms)
