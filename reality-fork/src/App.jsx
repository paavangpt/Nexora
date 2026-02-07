import { useState, useEffect, useCallback } from 'react';
import {
  FaCodeBranch,
  FaSave,
  FaExchangeAlt,
  FaHistory,
  FaRocket,
  FaTrash,
  FaDatabase,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaKeyboard,
  FaCode,
  FaBars,
  FaChevronLeft,
  FaUndo,
  FaExclamationTriangle,
} from 'react-icons/fa';

import { useVersionControl } from './hooks/useVersionControl';
import { allSamples } from './utils/sampleData';
import { clearAll } from './utils/storage';
import { getDiff } from './utils/versionControl';

import Editor from './components/Editor';
import VersionHistory from './components/VersionHistory';
import BranchManager from './components/BranchManager';
import DiffViewer from './components/DiffViewer';
import MergeConflicts from './components/MergeConflicts';
import Timeline from './components/Timeline';

function App() {
  const {
    versions,
    branches,
    currentBranch,
    currentVersion,
    currentData,
    selectedVersions,
    isLoading,
    commitVersion,
    createBranch,
    switchBranch,
    deleteBranch,
    rollbackToVersion,
    hardRollback,
    mergeBranches,
    completeMerge,
    updateCurrentData,
    toggleVersionSelection,
    resetAll,
    initWithData,
    canCommit,
    versionCount,
    branchList,
  } = useVersionControl();

  // UI state
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showTimelineView, setShowTimelineView] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mergeConflicts, setMergeConflicts] = useState(null);
  const [pendingMerge, setPendingMerge] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [notification, setNotification] = useState(null);
  const [branchFromVersion, setBranchFromVersion] = useState(null);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackTargetVersion, setRollbackTargetVersion] = useState(null);
  const [rollbackBranchName, setRollbackBranchName] = useState('');

  // Mobile responsive state
  const [mobileView, setMobileView] = useState('editor'); // 'history' | 'editor' | 'branches'
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check for first-time user
  useEffect(() => {
    if (!isLoading && versions.length === 0) {
      setShowWelcome(true);
    }
  }, [isLoading, versions.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (canCommit) {
          setShowCommitModal(true);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedVersions.length === 2) {
          setShowDiffModal(true);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setBranchFromVersion(currentVersion?.id || null);
        setShowBranchModal(true);
      }
      if (e.key === 'Escape') {
        setShowCommitModal(false);
        setShowDiffModal(false);
        setShowBranchModal(false);
        setShowHelp(false);
        setMergeConflicts(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canCommit, selectedVersions.length, currentVersion]);

  // Show notification
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle commit
  const handleCommit = useCallback(() => {
    if (!commitMessage.trim()) {
      showNotification('Please enter a commit message', 'error');
      return;
    }

    try {
      commitVersion(commitMessage.trim());
      setCommitMessage('');
      setShowCommitModal(false);
      showNotification('Version committed successfully', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [commitMessage, commitVersion, showNotification]);

  // Handle sample data load
  const handleLoadSample = useCallback((sampleKey) => {
    const data = allSamples[sampleKey];
    initWithData(data, `Initialize ${sampleKey} configuration`);
    setShowWelcome(false);
    showNotification(`Loaded ${sampleKey} sample data`, 'success');
  }, [initWithData, showNotification]);

  // Handle branch creation from version
  const handleBranchFromVersion = useCallback((versionId) => {
    setBranchFromVersion(versionId);
    setShowBranchModal(true);
  }, []);

  // Handle rollback - show modal with options
  const handleRollback = useCallback((versionId) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setRollbackTargetVersion(version);
      setRollbackBranchName(`rollback-${version.id.substring(0, 8)}`);
      setShowRollbackModal(true);
    }
  }, [versions]);

  // Soft rollback - creates a new branch from the version
  const handleSoftRollback = useCallback(async () => {
    if (!rollbackTargetVersion || !rollbackBranchName.trim()) {
      showNotification('Please enter a branch name', 'error');
      return;
    }

    try {
      // Create new branch from the rollback target version
      createBranch(rollbackBranchName.trim(), rollbackTargetVersion.id);
      // Switch to the new branch
      switchBranch(rollbackBranchName.trim());
      setShowRollbackModal(false);
      setRollbackTargetVersion(null);
      showNotification(`Created branch "${rollbackBranchName}" from version. Now on new branch.`, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [rollbackTargetVersion, rollbackBranchName, createBranch, switchBranch, showNotification]);

  // Hard rollback - deletes all versions after the target and resets to that version
  const handleHardRollback = useCallback(async () => {
    if (!rollbackTargetVersion) return;

    const confirmMsg = 'HARD ROLLBACK will permanently delete all versions after this point. This cannot be undone. Are you absolutely sure?';
    if (!confirm(confirmMsg)) return;

    try {
      await hardRollback(rollbackTargetVersion.id);
      setShowRollbackModal(false);
      setRollbackTargetVersion(null);
      showNotification('Hard rollback complete. All versions after this point have been deleted.', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [rollbackTargetVersion, hardRollback, showNotification]);

  // Handle merge
  const handleMerge = useCallback((sourceBranch, targetBranch) => {
    try {
      const result = mergeBranches(sourceBranch, targetBranch);

      if (!result.success) {
        // Has conflicts
        setMergeConflicts(result.conflicts);
        setPendingMerge({
          sourceBranch,
          targetBranch,
          mergedData: result.mergedData,
          sourceVersionId: result.sourceVersion.id,
        });
      } else {
        // No conflicts, complete merge
        completeMerge(
          result.mergedData,
          sourceBranch,
          result.sourceVersion.id,
          `Merge ${sourceBranch} into ${targetBranch}`
        );
        showNotification(`Merged ${sourceBranch} into ${targetBranch}`, 'success');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [mergeBranches, completeMerge, showNotification]);

  // Handle conflict resolution
  const handleResolveConflicts = useCallback(({ resolvedData }) => {
    if (!pendingMerge) return;

    const finalData = { ...pendingMerge.mergedData, ...resolvedData };
    completeMerge(
      finalData,
      pendingMerge.sourceBranch,
      pendingMerge.sourceVersionId,
      `Merge ${pendingMerge.sourceBranch} into ${pendingMerge.targetBranch} (with resolved conflicts)`
    );

    setMergeConflicts(null);
    setPendingMerge(null);
    showNotification('Merge completed with resolved conflicts', 'success');
  }, [pendingMerge, completeMerge, showNotification]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (confirm('This will delete ALL versions and branches. Are you absolutely sure?')) {
      clearAll();
      resetAll();
      setShowWelcome(true);
      showNotification('All data has been reset', 'info');
    }
  }, [resetAll, showNotification]);

  // Get diff for selected versions
  const selectedDiff = selectedVersions.length === 2 ? (() => {
    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);
    return v1 && v2 ? { version1: v1, version2: v2, diff: getDiff(v1, v2) } : null;
  })() : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaRocket className="text-6xl text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Initializing Reality Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="container-responsive py-2 lg:py-3">
          <div className="header-responsive">
            {/* Logo and title */}
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <FaCodeBranch className="text-white text-sm lg:text-xl" />
              </div>
              <div>
                <h1 className="header-title text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  REALITY FORK
                </h1>
                <p className="header-subtitle text-xs text-gray-500 hidden sm:block">Version Control for Parallel Realities</p>
              </div>
            </div>

            {/* Current branch indicator - hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 px-2 lg:px-3 py-1 lg:py-1.5 bg-gray-800 rounded-full">
              <FaCodeBranch className="text-blue-400 text-sm" />
              <span className="text-xs lg:text-sm font-medium text-gray-200">{currentBranch}</span>
              <span className="hidden md:inline text-xs text-gray-500">({versionCount} versions)</span>
            </div>

            {/* Action buttons - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Commit button */}
              <button
                onClick={() => setShowCommitModal(true)}
                disabled={!canCommit}
                className={`btn ${canCommit ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              >
                <FaSave />
                <span className="btn-text">Commit</span>
                {canCommit && <span className="ml-1 w-2 h-2 bg-green-300 rounded-full animate-pulse" />}
              </button>

              {/* View Diff button */}
              <button
                onClick={() => setShowDiffModal(true)}
                disabled={selectedVersions.length !== 2}
                className={`btn ${selectedVersions.length === 2 ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              >
                <FaExchangeAlt />
                <span className="btn-text">Diff ({selectedVersions.length}/2)</span>
              </button>

              {/* Timeline toggle */}
              <button
                onClick={() => setShowTimelineView(!showTimelineView)}
                className={`btn ${showTimelineView ? 'btn-primary' : 'btn-secondary'}`}
              >
                <FaHistory />
                <span className="btn-text">Timeline</span>
              </button>

              {/* Sample data dropdown */}
              <div className="relative group">
                <button className="btn btn-secondary">
                  <FaDatabase />
                  <span className="btn-text">Samples</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {Object.keys(allSamples).map(key => (
                    <button
                      key={key}
                      onClick={() => handleLoadSample(key)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Help button */}
              <button
                onClick={() => setShowHelp(true)}
                className="btn btn-secondary"
                title="Help & Keyboard Shortcuts"
              >
                <FaKeyboard />
              </button>

              {/* Reset button */}
              <button
                onClick={handleReset}
                className="btn btn-danger"
                title="Reset all data"
              >
                <FaTrash />
              </button>
            </div>

            {/* Mobile/Tablet action buttons */}
            <div className="flex lg:hidden items-center gap-1">
              {/* Quick commit on mobile */}
              <button
                onClick={() => setShowCommitModal(true)}
                disabled={!canCommit}
                className={`btn p-2 ${canCommit ? 'btn-success' : 'btn-secondary opacity-50'}`}
                title="Commit"
              >
                <FaSave />
              </button>

              {/* Menu toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="btn btn-secondary p-2"
                title="Menu"
              >
                <FaBars />
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden mt-3 p-3 bg-gray-800/90 rounded-lg animate-slideUp border border-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => { setShowDiffModal(true); setShowMobileMenu(false); }}
                  disabled={selectedVersions.length !== 2}
                  className={`btn text-sm ${selectedVersions.length === 2 ? 'btn-primary' : 'btn-secondary opacity-50'}`}
                >
                  <FaExchangeAlt /> Diff
                </button>
                <button
                  onClick={() => { setShowTimelineView(!showTimelineView); setShowMobileMenu(false); }}
                  className={`btn text-sm ${showTimelineView ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <FaHistory /> Timeline
                </button>
                <button
                  onClick={() => setShowHelp(true)}
                  className="btn btn-secondary text-sm"
                >
                  <FaKeyboard /> Help
                </button>
                <div className="relative col-span-2 sm:col-span-1">
                  <select
                    onChange={(e) => { if (e.target.value) handleLoadSample(e.target.value); setShowMobileMenu(false); }}
                    className="input text-sm w-full"
                    defaultValue=""
                  >
                    <option value="" disabled>Load Sample...</option>
                    {Object.keys(allSamples).map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleReset}
                  className="btn btn-danger text-sm"
                >
                  <FaTrash /> Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className={`flex-1 flex overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
        {showTimelineView ? (
          /* Timeline view - responsive padding */
          <div className="flex-1 p-2 lg:p-4">
            <div className="h-full glass-panel overflow-hidden">
              <Timeline
                versions={versions}
                branches={branches}
                currentVersion={currentVersion}
                currentBranch={currentBranch}
                onVersionClick={(v) => handleRollback(v.id)}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Desktop 3-column layout */}
            <div className="hidden lg:flex flex-1 overflow-hidden">
              {/* Left sidebar - Version History */}
              <aside className="w-80 border-r border-gray-700 bg-gray-900/50 flex-shrink-0 overflow-hidden">
                <VersionHistory
                  versions={versions}
                  currentVersion={currentVersion}
                  selectedVersions={selectedVersions}
                  branches={branches}
                  currentBranch={currentBranch}
                  onVersionSelect={toggleVersionSelection}
                  onRollback={handleRollback}
                  onBranchFromVersion={handleBranchFromVersion}
                />
              </aside>

              {/* Center - Editor */}
              <div className="flex-1 p-4 overflow-hidden">
                <div className="h-full glass-panel overflow-hidden">
                  <Editor
                    data={currentData}
                    onChange={updateCurrentData}
                    readOnly={false}
                  />
                </div>
              </div>

              {/* Right sidebar - Branch Manager */}
              <aside className="w-80 border-l border-gray-700 bg-gray-900/50 flex-shrink-0 overflow-hidden">
                <BranchManager
                  branches={branches}
                  currentBranch={currentBranch}
                  versions={versions}
                  onCreateBranch={(name, versionId) => {
                    try {
                      createBranch(name, versionId);
                      setShowBranchModal(false);
                      showNotification(`Branch "${name}" created`, 'success');
                    } catch (error) {
                      showNotification(error.message, 'error');
                    }
                  }}
                  onSwitchBranch={(name) => {
                    try {
                      switchBranch(name);
                      showNotification(`Switched to branch "${name}"`, 'info');
                    } catch (error) {
                      showNotification(error.message, 'error');
                    }
                  }}
                  onDeleteBranch={(name) => {
                    try {
                      deleteBranch(name);
                      showNotification(`Branch "${name}" deleted`, 'info');
                    } catch (error) {
                      showNotification(error.message, 'error');
                    }
                  }}
                  onMergeBranch={handleMerge}
                />
              </aside>
            </div>

            {/* Mobile/Tablet single view with navigation */}
            <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
              {/* Content based on mobileView */}
              <div className="flex-1 overflow-hidden">
                {mobileView === 'history' && (
                  <div className="h-full bg-gray-900/50 overflow-auto animate-fadeIn">
                    <VersionHistory
                      versions={versions}
                      currentVersion={currentVersion}
                      selectedVersions={selectedVersions}
                      branches={branches}
                      currentBranch={currentBranch}
                      onVersionSelect={toggleVersionSelection}
                      onRollback={handleRollback}
                      onBranchFromVersion={handleBranchFromVersion}
                    />
                  </div>
                )}

                {mobileView === 'editor' && (
                  <div className="h-full p-2 overflow-hidden animate-fadeIn">
                    <div className="h-full glass-panel overflow-hidden">
                      <Editor
                        data={currentData}
                        onChange={updateCurrentData}
                        readOnly={false}
                      />
                    </div>
                  </div>
                )}

                {mobileView === 'branches' && (
                  <div className="h-full bg-gray-900/50 overflow-auto animate-fadeIn">
                    <BranchManager
                      branches={branches}
                      currentBranch={currentBranch}
                      versions={versions}
                      onCreateBranch={(name, versionId) => {
                        try {
                          createBranch(name, versionId);
                          showNotification(`Branch "${name}" created`, 'success');
                        } catch (error) {
                          showNotification(error.message, 'error');
                        }
                      }}
                      onSwitchBranch={(name) => {
                        try {
                          switchBranch(name);
                          showNotification(`Switched to branch "${name}"`, 'info');
                        } catch (error) {
                          showNotification(error.message, 'error');
                        }
                      }}
                      onDeleteBranch={(name) => {
                        try {
                          deleteBranch(name);
                          showNotification(`Branch "${name}" deleted`, 'info');
                        } catch (error) {
                          showNotification(error.message, 'error');
                        }
                      }}
                      onMergeBranch={handleMerge}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile bottom navigation */}
            <nav className="mobile-nav-tabs lg:hidden">
              <button
                onClick={() => setMobileView('history')}
                className={`mobile-nav-tab ${mobileView === 'history' ? 'active' : ''}`}
              >
                <FaHistory />
                <span>History</span>
              </button>
              <button
                onClick={() => setMobileView('editor')}
                className={`mobile-nav-tab ${mobileView === 'editor' ? 'active' : ''}`}
              >
                <FaCode />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setMobileView('branches')}
                className={`mobile-nav-tab ${mobileView === 'branches' ? 'active' : ''}`}
              >
                <FaCodeBranch />
                <span>Branches</span>
              </button>
            </nav>
          </>
        )}
      </main>

      {/* Modals */}

      {/* Commit Modal */}
      {showCommitModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowCommitModal(false)}>
          <div
            className="glass-panel w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-100 mb-4">Commit Changes</h2>
            <p className="text-sm text-gray-400 mb-4">
              Create a new version snapshot of your current reality matrix.
            </p>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Enter commit message..."
              className="input mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCommitModal(false)} className="btn btn-secondary">
                <FaTimes /> Cancel
              </button>
              <button onClick={handleCommit} className="btn btn-success">
                <FaCheck /> Commit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {showDiffModal && selectedDiff && (
        <DiffViewer
          version1={selectedDiff.version1}
          version2={selectedDiff.version2}
          diff={selectedDiff.diff}
          onClose={() => setShowDiffModal(false)}
        />
      )}

      {/* Merge Conflicts Modal */}
      {mergeConflicts && pendingMerge && (
        <MergeConflicts
          conflicts={mergeConflicts}
          sourceBranch={pendingMerge.sourceBranch}
          targetBranch={pendingMerge.targetBranch}
          onResolve={handleResolveConflicts}
          onCancel={() => {
            setMergeConflicts(null);
            setPendingMerge(null);
          }}
        />
      )}

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="modal-overlay animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FaCodeBranch className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Welcome to Reality Fork</h2>
            <p className="text-gray-400 mb-6">
              A version control system for managing parallel realities of structured data.
              Branch, diff, merge, and rollback with ease.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleLoadSample('quantumReactor')}
                className="btn btn-primary w-full justify-center"
              >
                <FaRocket /> Start with Sample Data
              </button>
              <button
                onClick={() => {
                  initWithData({}, 'Initialize empty reality');
                  setShowWelcome(false);
                }}
                className="btn btn-secondary w-full justify-center"
              >
                Start with Empty State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Modal */}
      {showRollbackModal && rollbackTargetVersion && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowRollbackModal(false)}>
          <div
            className="glass-panel w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <FaUndo className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100">Rollback Options</h2>
                <p className="text-xs text-gray-400">Choose how to rollback to this version</p>
              </div>
            </div>

            <div className="bg-gray-800/60 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-300 mb-1">Target Version:</p>
              <p className="font-medium text-gray-100">{rollbackTargetVersion.message}</p>
              <p className="text-xs text-gray-500 mt-1">#{rollbackTargetVersion.id.substring(0, 8)}</p>
            </div>

            <div className="space-y-4">
              {/* Soft Rollback */}
              <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <FaCodeBranch className="text-green-400" />
                  <h3 className="font-medium text-green-400">Soft Rollback</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Creates a new branch from this version. All existing versions and branches remain intact.
                </p>
                <input
                  type="text"
                  value={rollbackBranchName}
                  onChange={(e) => setRollbackBranchName(e.target.value)}
                  placeholder="New branch name..."
                  className="input mb-3 text-sm"
                />
                <button
                  onClick={handleSoftRollback}
                  className="btn btn-success w-full"
                >
                  <FaCodeBranch /> Create Branch & Switch
                </button>
              </div>

              {/* Hard Rollback */}
              <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <FaExclamationTriangle className="text-red-400" />
                  <h3 className="font-medium text-red-400">Hard Rollback</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  <strong className="text-red-300">DESTRUCTIVE:</strong> Permanently deletes all versions after this point. This cannot be undone.
                </p>
                <button
                  onClick={handleHardRollback}
                  className="btn btn-danger w-full"
                >
                  <FaTrash /> Delete Future Versions
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowRollbackModal(false)}
              className="btn btn-secondary w-full mt-4"
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowHelp(false)}>
          <div
            className="glass-panel w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100">Help & Shortcuts</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-200">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-200 mb-2">Keyboard Shortcuts</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Ctrl/Cmd + S', 'Quick commit'],
                    ['Ctrl/Cmd + D', 'Toggle diff view'],
                    ['Ctrl/Cmd + B', 'Create new branch'],
                    ['Escape', 'Close modals'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">{key}</kbd>
                      <span className="text-gray-400">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-200 mb-2">Concepts</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p><strong className="text-blue-400">Version:</strong> A snapshot of your data at a point in time.</p>
                  <p><strong className="text-green-400">Branch:</strong> A parallel timeline for experimenting with changes.</p>
                  <p><strong className="text-purple-400">Merge:</strong> Combine changes from two branches together.</p>
                  <p><strong className="text-orange-400">Rollback:</strong> Restore data to a previous version.</p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowHelp(false)} className="btn btn-primary w-full mt-6">
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`toast toast-${notification.type} animate-slideUp`}>
          <div className="flex items-center gap-2">
            <FaInfoCircle />
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
