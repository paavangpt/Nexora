import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
    FaCodeBranch,
    FaPlus,
    FaTrash,
    FaRandom,
    FaCheck,
    FaTimes,
    FaExchangeAlt,
    FaClock,
} from 'react-icons/fa';

/**
 * Branch Manager component - create, switch, delete, and merge branches
 */
export default function BranchManager({
    branches,
    currentBranch,
    versions,
    onCreateBranch,
    onSwitchBranch,
    onDeleteBranch,
    onMergeBranch,
}) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showMergeForm, setShowMergeForm] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [sourceBranch, setSourceBranch] = useState('');
    const [error, setError] = useState('');

    const branchList = Object.keys(branches);

    // Get version info for each branch
    const branchInfo = useMemo(() => {
        const info = {};
        branchList.forEach(branchName => {
            const versionId = branches[branchName];
            const version = versions.find(v => v.id === versionId);
            info[branchName] = {
                versionId,
                version,
            };
        });
        return info;
    }, [branches, versions, branchList]);

    const getBranchColor = (branchName) => {
        const colors = [
            'from-cyan-500 to-cyan-400',
            'from-indigo-500 to-indigo-400',
            'from-purple-500 to-purple-400',
            'from-emerald-500 to-emerald-400',
            'from-rose-500 to-rose-400',
        ];
        const hash = branchName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const handleCreateBranch = () => {
        setError('');
        if (!newBranchName.trim()) { setError('Identifier required'); return; }
        try {
            onCreateBranch(newBranchName.trim(), selectedVersion || null);
            setNewBranchName('');
            setSelectedVersion('');
            setShowCreateForm(false);
        } catch (e) { setError(e.message); }
    };

    return (
        <div className="h-full flex flex-col rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-8 py-12 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(129,140,248,0.1)]">
                        <FaCodeBranch />
                    </div>
                    <div>
                        <h2 className="font-display font-black text-white text-xl uppercase italic tracking-tighter">Vector Hub</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-indigo-500" />
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                {branchList.length} paths active
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-8 grid grid-cols-2 gap-4 border-b border-white/5">
                <button
                    onClick={() => { setShowCreateForm(!showCreateForm); setShowMergeForm(false); setError(''); }}
                    className="btn btn-primary h-12 bg-indigo-500"
                >
                    <FaPlus /> <span>New Fork</span>
                </button>
                <button
                    onClick={() => { setShowMergeForm(!showMergeForm); setShowCreateForm(false); setError(''); }}
                    className="btn btn-secondary h-12"
                    disabled={branchList.length < 2}
                >
                    <FaRandom /> <span>Merge</span>
                </button>
            </div>

            {/* Forms */}
            {(showCreateForm || showMergeForm) && (
                <div className="px-8 py-10 border-b border-white/10 bg-white/[0.03] animate-fadeIn">
                    {showCreateForm && (
                        <div className="space-y-6">
                            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-indigo-400">Initialize Parallel Vector</h3>
                            <input
                                type="text"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                placeholder="Branch identifier…"
                                className="input h-12 font-mono focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCreateBranch} className="btn btn-primary bg-indigo-500 flex-1 h-11 uppercase text-[10px] tracking-widest">Confirm</button>
                                <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary h-11"><FaTimes /></button>
                            </div>
                        </div>
                    )}
                    {showMergeForm && (
                        <div className="space-y-6">
                            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-white">Integrate Sequence</h3>
                            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                                <select
                                    value={sourceBranch}
                                    onChange={(e) => setSourceBranch(e.target.value)}
                                    className="input h-11 text-xs focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                                >
                                    <option value="">Source…</option>
                                    {branchList.filter(b => b !== currentBranch).map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <FaExchangeAlt className="text-white/20" />
                                <div className="input h-11 text-xs flex items-center bg-white/5 border-indigo-500/30 text-indigo-400">{currentBranch}</div>
                            </div>
                            <button
                                onClick={() => onMergeBranch(sourceBranch, currentBranch)}
                                disabled={!sourceBranch}
                                className="btn btn-primary bg-indigo-500 w-full h-11 uppercase text-[10px] tracking-widest disabled:opacity-30"
                            >
                                Execute Integration
                            </button>
                        </div>
                    )}
                    {error && <p className="mt-4 text-[10px] font-bold text-rose-500 uppercase tracking-tight">{error}</p>}
                </div>
            )}

            {/* Branch List */}
            <div className="flex-1 overflow-y-auto px-8 py-12 space-y-8 scrollbar-hide">
                {branchList.map(branchName => {
                    const info = branchInfo[branchName];
                    const isCurrent = branchName === currentBranch;

                    return (
                        <div
                            key={branchName}
                            onClick={() => !isCurrent && onSwitchBranch(branchName)}
                            className={`
                                        group relative p-9 glass-panel transition-all duration-300
                                        ${isCurrent ? 'border-indigo-500/50 bg-indigo-500/[0.03] scale-[1.02]' : 'hover:bg-white/[0.04] cursor-pointer'}
                                    `}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-md rotate-45 bg-gradient-to-br ${getBranchColor(branchName)} ${isCurrent ? 'shadow-[0_0_15px_rgba(129,140,248,0.5)]' : ''}`} />
                                    <span className="font-display font-black text-white text-[15px] uppercase italic tracking-tighter">{branchName}</span>
                                </div>
                                {isCurrent && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.2em]">Active</span>
                                    </div>
                                )}
                            </div>

                            {info.version ? (
                                <div className="space-y-5 mb-8">
                                    <p className="text-[11px] font-medium text-slate-400 line-clamp-1 italic">"{info.version.message}"</p>
                                    <div className="flex items-center gap-2 opacity-60">
                                        <FaClock className="text-[10px] text-indigo-400" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest tabular-nums">{format(new Date(info.version.timestamp), 'MMM d, HH:mm')}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-600 italic mb-8">Void Matrix</p>
                            )}

                            {!isCurrent && (
                                <div className="flex gap-6 mt-6">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSwitchBranch(branchName); }}
                                        className="h-9 flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                                        aria-label={`Switch active sequence to ${branchName}`}
                                    >
                                        Inhabit
                                    </button>
                                    {branchName !== 'main' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (confirm(`Purge branch "${branchName}"?`)) onDeleteBranch(branchName); }}
                                            className="h-9 w-10 flex items-center justify-center bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 rounded-lg text-rose-500/60 hover:text-rose-500 transition-all focus-visible:ring-1 focus-visible:ring-rose-500/30"
                                            aria-label={`Purge branch ${branchName}`}
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
