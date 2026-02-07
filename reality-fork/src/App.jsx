import { useState, useEffect, useCallback } from 'react';
import {
  FaCodeBranch,
  FaSave,
  FaExchangeAlt,
  FaHistory,
  FaRocket,
  FaTrash,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaKeyboard,
  FaCode,
  FaBars,
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
    hardRollback,
    mergeBranches,
    completeMerge,
    updateCurrentData,
    toggleVersionSelection,
    resetAll,
    initWithData,
    canCommit,
    versionCount,
  } = useVersionControl();

  // UI state
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
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
  const [newBranchName, setNewBranchName] = useState('');

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        // Reset mobile view if we are on desktop
      }
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
        setShowRollbackModal(false);
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
      setRollbackBranchName(`fork-${version.id.substring(0, 6)}`);
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
      createBranch(rollbackBranchName.trim(), rollbackTargetVersion.id);
      switchBranch(rollbackBranchName.trim());
      setShowRollbackModal(false);
      setRollbackTargetVersion(null);
      setRollbackBranchName('');
      showNotification(`Fork successful: ${rollbackBranchName}`, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [rollbackTargetVersion, rollbackBranchName, createBranch, switchBranch, showNotification]);

  // Hard rollback - deletes all versions after the target and resets to that version
  const handleHardRollback = useCallback(async () => {
    if (!rollbackTargetVersion) return;

    if (!confirm('HARD ROLLBACK: This is destructive and permanent. Delete all subsequent versions?')) return;

    try {
      await hardRollback(rollbackTargetVersion.id);
      setShowRollbackModal(false);
      setRollbackTargetVersion(null);
      showNotification('Hard rollback complete.', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [rollbackTargetVersion, hardRollback, showNotification]);

  // Handle merge
  const handleMerge = useCallback((sourceBranch, targetBranch) => {
    try {
      const result = mergeBranches(sourceBranch, targetBranch);

      if (!result.success) {
        setMergeConflicts(result.conflicts);
        setPendingMerge({
          sourceBranch,
          targetBranch,
          mergedData: result.mergedData,
          sourceVersionId: result.sourceVersion.id,
        });
      } else {
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
    showNotification('Merge completed', 'success');
  }, [pendingMerge, completeMerge, showNotification]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (confirm('Erase all timelines? This action cannot be undone.')) {
      clearAll();
      resetAll();
      setShowWelcome(true);
      showNotification('System reset successful', 'info');
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
      <div className="min-h-screen flex items-center justify-center bg-[#03050a]">
        <div className="text-center animate-fadeIn">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-500 animate-spin-slow" />
            <FaRocket className="absolute inset-0 m-auto text-3xl text-cyan-400" />
          </div>
          <p className="font-display font-semibold text-lg tracking-widest text-cyan-500 uppercase">Synchronizing Reality</p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-deep selection:bg-cyan-500/30">
      {/* Header - Immersive Glass */}
      <header className="h-[var(--header-height)] glass-panel border-0 border-b border-subtle rounded-none z-[100] flex items-center px-6 flex-shrink-0">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => setShowWelcome(true)}>
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 group-hover:opacity-50 transition-all duration-500" />
              <div className="relative w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)] transform transition-transform group-hover:rotate-12">
                <FaCodeBranch className="text-bg-deep text-2xl" />
              </div>
            </div>
            <div className="select-none">
              <h1 className="text-2xl font-display font-black tracking-tighter text-white leading-none">
                REALITY<span className="text-cyan-400 ml-1">FORK</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <p className="text-[9px] font-bold tracking-[0.3em] text-cyan-500/70 uppercase">Parallel Temporal Control</p>
              </div>
            </div>
          </div>

          {/* Center Stats */}
          <div className="hidden xl:flex items-center h-11 px-6 bg-white/[0.03] border border-white/5 rounded-2xl gap-6 font-display">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-0.5">Active Sequence</span>
              <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-2">
                <FaCodeBranch className="text-[10px]" /> {currentBranch}
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-0.5">Vector Nodes</span>
              <span className="text-xs font-bold text-indigo-400 font-mono flex items-center gap-2">
                <FaHistory className="text-[10px]" /> {versionCount} units
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 pr-6 border-r border-white/5">
              <button
                onClick={() => setShowCommitModal(true)}
                disabled={!canCommit}
                className={`btn btn-primary h-11 px-6 ${!canCommit && 'opacity-30 grayscale cursor-not-allowed'}`}
                style={{ background: canCommit ? 'var(--accent-success)' : undefined }}
              >
                <FaSave />
                <span className="uppercase tracking-wider text-[11px]">Snapshot</span>
                {canCommit && <div className="w-2 h-2 rounded-full bg-white animate-pulse ml-1" />}
              </button>

              <button
                onClick={() => setShowDiffModal(true)}
                disabled={selectedVersions.length !== 2}
                className={`btn btn-secondary h-11 px-6 ${selectedVersions.length !== 2 && 'opacity-30'}`}
              >
                <FaExchangeAlt />
                <span className="uppercase tracking-wider text-[11px]">Compare ({selectedVersions.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pl-2">
              <button
                onClick={() => setShowHelp(true)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                title="Shortcuts"
              >
                <FaKeyboard className="text-lg" />
              </button>
              <button
                onClick={handleReset}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/20 transition-all"
                title="Reset Workspace"
              >
                <FaTrash className="text-lg" />
              </button>
            </div>

            <button
              onClick={() => setMobileView(mobileView === 'editor' ? 'history' : 'editor')}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 main-grid overflow-hidden bg-white/[0.01]">
        {/* Left: History */}
        <aside className={`${mobileView === 'history' ? 'flex' : 'hidden'} lg:flex flex-col glass-panel overflow-hidden border-0 lg:border-r`}>
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

        {/* Center: Editor */}
        <section className={`${mobileView === 'editor' ? 'flex' : 'hidden'} lg:flex flex-col glass-panel animate-fadeIn overflow-hidden border-0`} style={{ animationDelay: '0.1s' }}>
          <Editor
            data={currentData}
            onChange={updateCurrentData}
            onCommit={() => setShowCommitModal(true)}
            canCommit={canCommit}
            currentBranch={currentBranch}
          />
        </section>

        {/* Right: Branches */}
        <aside className={`${mobileView === 'branches' ? 'flex' : 'hidden'} lg:flex flex-col glass-panel overflow-hidden border-0 lg:border-l`}>
          <BranchManager
            branches={branches}
            currentBranch={currentBranch}
            versions={versions}
            onSwitchBranch={switchBranch}
            onCreateBranch={() => setShowBranchModal(true)}
            onDeleteBranch={deleteBranch}
            onMergeBranch={handleMerge}
          />
        </aside>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden h-20 glass-panel rounded-none border-0 border-t border-subtle flex items-center px-4 py-2 gap-3 flex-shrink-0">
        {[
          { id: 'history', icon: <FaHistory />, label: 'History' },
          { id: 'editor', icon: <FaCode />, label: 'Editor' },
          { id: 'branches', icon: <FaCodeBranch />, label: 'Branches' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileView(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-300 ${mobileView === tab.id ? 'text-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'text-slate-500'
              }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {showCommitModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowCommitModal(false)}>
          <div className="glass-panel w-full max-w-lg p-8 m-4 animate-slideRight" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-accent-success/20 flex items-center justify-center text-accent-success">
                <FaSave className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Capture Reality</h2>
                <p className="text-xs text-slate-400 italic">Generate persistent snapshot of current data matrix</p>
              </div>
            </div>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Designate snapshot identifier..."
              className="input min-h-[140px] resize-none mb-6 font-medium text-lg placeholder:opacity-30"
              autoFocus
            />
            <div className="flex gap-6">
              <button onClick={() => setShowCommitModal(false)} className="btn btn-secondary flex-1 h-12 uppercase tracking-widest text-[10px]">Abort</button>
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                className="btn btn-primary bg-accent-success flex-1 h-12 disabled:opacity-30 uppercase tracking-widest text-[10px]"
              >
                Snapshot Sequence
              </button>
            </div>
          </div>
        </div>
      )}

      {showBranchModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => { setShowBranchModal(false); setBranchFromVersion(null); }}>
          <div className="glass-panel w-full max-w-md p-8 m-4 animate-slideRight" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-accent-primary/20 flex items-center justify-center text-accent-primary text-xl">
                <FaCodeBranch />
              </div>
              <h2 className="text-xl font-display font-bold text-white uppercase">Initialize Fork</h2>
            </div>
            <input
              type="text"
              value={newBranchName}
              placeholder="Fork identifier..."
              onChange={(e) => setNewBranchName(e.target.value)}
              className="input mb-8 font-mono"
              autoFocus
            />
            <div className="flex gap-4">
              <button onClick={() => { setShowBranchModal(false); setBranchFromVersion(null); }} className="btn btn-secondary flex-1">Exit</button>
              <button
                onClick={() => {
                  createBranch(newBranchName, branchFromVersion);
                  setShowBranchModal(false);
                  setNewBranchName('');
                  setBranchFromVersion(null);
                  showNotification(`Fork successful: ${newBranchName}`, 'success');
                }}
                disabled={!newBranchName.trim()}
                className="btn btn-primary flex-1 disabled:opacity-30"
              >
                Confirm Fork
              </button>
            </div>
          </div>
        </div>
      )}

      {showRollbackModal && rollbackTargetVersion && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowRollbackModal(false)}>
          <div className="glass-panel w-full max-w-md p-8 m-4 animate-slideRight" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-accent-warning/20 flex items-center justify-center text-accent-warning text-xl">
                <FaUndo />
              </div>
              <h2 className="text-xl font-display font-bold text-white uppercase">Temporal Shift</h2>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 mb-8 border border-white/5">
              <p className="text-[10px] font-black text-muted uppercase tracking-wider mb-2 font-display">Target Coordinate:</p>
              <p className="font-bold text-white text-lg leading-snug">{rollbackTargetVersion.message}</p>
              <p className="text-xs font-mono text-cyan-400/60 mt-1">HEX: {rollbackTargetVersion.id.substring(0, 16)}...</p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-accent-success/20 bg-accent-success/5">
                <h3 className="font-display font-bold text-accent-success mb-2 uppercase text-xs">Protocol: SOFT</h3>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">Safety Fork: Original timeline persists. New path created from this point.</p>
                <input
                  type="text"
                  value={rollbackBranchName}
                  onChange={(e) => setRollbackBranchName(e.target.value)}
                  placeholder="New identifier..."
                  className="input h-10 text-sm mb-4 bg-black/40"
                />
                <button onClick={handleSoftRollback} className="btn btn-success w-full h-11 text-[10px] uppercase font-bold tracking-widest">Execute Fork</button>
              </div>

              <div className="p-5 rounded-2xl border border-accent-danger/20 bg-accent-danger/5">
                <h3 className="font-display font-bold text-accent-danger mb-2 uppercase text-xs">Protocol: HARD</h3>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">Destructive Shift: Purges all snapshots ahead of this point in current vector.</p>
                <button onClick={handleHardRollback} className="btn btn-danger w-full h-11 text-[10px] uppercase font-bold tracking-widest">Collapse Future</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiffModal && selectedDiff && (
        <div className="modal-overlay" onClick={() => setShowDiffModal(false)}>
          <div className="glass-panel w-full max-w-6xl h-[85vh] flex flex-col m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter">Vector Analysis</h2>
              <button onClick={() => setShowDiffModal(false)} className="text-slate-500 hover:text-white transition-colors"><FaTimes /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-black/40">
              <DiffViewer
                version1={selectedDiff.version1}
                version2={selectedDiff.version2}
                diff={selectedDiff.diff}
              />
            </div>
            <div className="p-8 border-t border-white/5 flex justify-end">
              <button onClick={() => setShowDiffModal(false)} className="btn btn-primary h-11 px-10 uppercase tracking-widest text-[10px]">End Analysis</button>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="glass-panel w-full max-w-lg p-8 m-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-display font-black text-white italic tracking-tighter mb-8 decoration-cyan-500 decoration-4 underline underline-offset-8">SYSTEM_PROTOCOL</h2>
            <div className="space-y-6">
              {[
                { k: '⌘ S', d: 'Immediate state snapshot' },
                { k: '⌘ D', d: 'Toggle vector analysis' },
                { k: '⌘ B', d: 'Initialize new fork' },
                { k: 'ESC', d: 'Collapse overlays' }
              ].map(s => (
                <div key={s.k} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <kbd className="px-3 py-1 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-cyan-400">{s.k}</kbd>
                  <span className="text-xs text-slate-400 font-medium">{s.d}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHelp(false)} className="btn btn-primary w-full mt-10 h-12 uppercase tracking-[0.2em] font-black italic">Acknowledge</button>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="modal-overlay">
          <div className="glass-panel w-full max-w-lg p-10 text-center animate-fadeIn">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-4xl text-deep shadow-2xl">
                <FaRocket />
              </div>
            </div>
            <h1 className="text-4xl font-display font-black text-white mb-3 tracking-tighter uppercase italic">Reality_Fork_v1.0</h1>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium">Coordinate parallel data timelines with precision. Select operational mode to begin.</p>
            <div className="space-y-4">
              <button onClick={() => handleLoadSample('quantumReactor')} className="btn btn-primary w-full h-14 justify-center text-xs tracking-[0.2em] uppercase font-black">Load Matrix Sample</button>
              <button onClick={() => { initWithData({}, 'Initialization'); setShowWelcome(false); }} className="btn btn-secondary w-full h-14 justify-center text-xs tracking-[0.2em] uppercase font-bold">New Void Matrix</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`toast toast-${notification.type} shadow-[0_20px_60px_rgba(0,0,0,0.6)]`}>
          <div className="flex items-center gap-3">
            <FaInfoCircle className="text-lg opacity-80" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{notification.message}</span>
          </div>
        </div>
      )}

      {mergeConflicts && pendingMerge && (
        <MergeConflicts
          conflicts={mergeConflicts}
          sourceBranch={pendingMerge.sourceBranch}
          targetBranch={pendingMerge.targetBranch}
          onResolve={handleResolveConflicts}
          onCancel={() => { setMergeConflicts(null); setPendingMerge(null); }}
        />
      )}
    </div>
  );
}

export default App;
