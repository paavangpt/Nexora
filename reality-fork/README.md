# Reality Fork - Version Control for Parallel Realities

A Git-like version control system for structured JSON data, built with React and localStorage.

![Reality Fork](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

- ✅ **Branch and Fork** - Create parallel timelines for experimenting with changes
- ✅ **Compare and Diff** - Visual comparison between any two versions
- ✅ **Merge with Conflict Resolution** - Three-way merge with interactive conflict resolution
- ✅ **Rollback** - Restore data to any previous state
- ✅ **Visual Timeline** - See your version history as a graph
- ✅ **Local-first** - All data persisted in localStorage

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📖 Usage

### Basic Workflow

1. **Edit JSON data** in the central editor
2. **Commit changes** with a descriptive message
3. **Create branches** to experiment with different configurations
4. **Merge branches** to combine changes
5. **View diffs** between any two versions
6. **Rollback** to restore previous states

### Creating a Branch

1. Click "New Branch" in the right sidebar
2. Enter a branch name (e.g., "experiment")
3. Optionally select which version to branch from
4. Click "Create"

### Comparing Versions

1. Select two versions by clicking their checkboxes in the timeline
2. Click the "Diff" button in the header
3. View added, removed, and modified fields

### Merging Branches

1. Click "Merge" in the Branch Manager
2. Select the source branch
3. Click "Merge" to combine with current branch
4. If conflicts exist, resolve them manually
5. A merge commit is created automatically

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Quick commit |
| `Ctrl/Cmd + D` | Toggle diff view |
| `Ctrl/Cmd + B` | Create new branch |
| `Escape` | Close modals |

## 🛠 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **localStorage** - Data persistence
- **date-fns** - Date formatting
- **uuid** - Unique ID generation
- **react-icons** - Icons

## 📁 Project Structure

```
src/
├── components/
│   ├── Editor.jsx          # JSON editor with validation
│   ├── VersionHistory.jsx  # Timeline of versions
│   ├── BranchManager.jsx   # Branch management UI
│   ├── DiffViewer.jsx      # Version comparison
│   ├── MergeConflicts.jsx  # Conflict resolution
│   └── Timeline.jsx        # Visual timeline graph
├── hooks/
│   └── useVersionControl.js # Main state management hook
├── utils/
│   ├── storage.js          # localStorage wrapper
│   ├── versionControl.js   # Core version control logic
│   └── sampleData.js       # Sample data sets
├── App.jsx                 # Main application
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## 🔧 Core Concepts

### Version
A snapshot of your JSON data at a specific point in time. Each version has:
- Unique ID
- Parent ID (linking to previous version)
- Data snapshot
- Timestamp
- Commit message
- Author

### Branch
A named pointer to a specific version. Branches allow parallel development of different configurations.

### Merge
Combining changes from two branches. Uses three-way merge algorithm:
- Finds common ancestor
- Compares changes from both branches
- Auto-resolves non-conflicting changes
- Prompts for conflict resolution when needed

### Rollback
Restoring the editor to a previous version's data. Note: rollback doesn't automatically commit - you must commit after rollback to save the change.

## 🎨 Theming

The app uses a sci-fi inspired dark theme with:
- Dark blue-black backgrounds
- Cyan and blue accents
- Glassmorphism effects
- Smooth animations
- Custom scrollbars

## 📝 Sample Data

Built-in sample datasets for quick testing:
- **Quantum Reactor** - Reactor configuration
- **Spaceship Config** - Starship settings
- **Timeline Data** - Reality timeline
- **Neural Network** - AI system config
- **Dimensional Gateway** - Portal settings

## 🔒 Data Storage

All data is stored in localStorage with the prefix `reality-fork-`:
- `reality-fork-versions` - Array of all versions
- `reality-fork-branches` - Branch name to version ID mapping
- `reality-fork-current-branch` - Active branch name

## 📄 License

MIT License - Feel free to use and modify!

---

Built with ❤️ for the hackathon
