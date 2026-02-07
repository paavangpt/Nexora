import { useMemo } from 'react';
import { format } from 'date-fns';
import {
    FaHistory,
    FaClock,
    FaCodeBranch,
    FaUndo,
    FaCheckSquare,
    FaSquare,
    FaProjectDiagram,
    FaUser,
} from 'react-icons/fa';

/**
 * Version History component - displays timeline of all versions
 */
export default function VersionHistory({
    versions,
    currentVersion,
    selectedVersions,
    branches,
    currentBranch,
    onVersionSelect,
    onRollback,
    onBranchFromVersion,
}) {
    // Sort versions by timestamp (most recent first)
    const sortedVersions = useMemo(() => {
        return [...versions].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }, [versions]);

    // Get branch for each version
    const versionBranches = useMemo(() => {
        const branchMap = {};
        Object.entries(branches).forEach(([branchName, versionId]) => {
            if (versionId) {
                if (!branchMap[versionId]) {
                    branchMap[versionId] = [];
                }
                branchMap[versionId].push(branchName);
            }
        });
        return branchMap;
    }, [branches]);

    const getBranchColor = (branchName) => {
        const colors = [
            'text-cyan-400 border-cyan-500/30',
            'text-indigo-400 border-indigo-500/30',
            'text-purple-400 border-purple-500/30',
            'text-emerald-400 border-emerald-500/30',
            'text-rose-400 border-rose-500/30',
        ];
        const hash = branchName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    if (versions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                <div className="w-16 h-16 rounded-full bg-slate-800/30 flex items-center justify-center mb-6">
                    <FaHistory className="text-3xl opacity-20" />
                </div>
                <h3 className="font-display font-bold text-slate-400 uppercase tracking-widest text-xs mb-2">Void Timeline</h3>
                <p className="text-[11px] text-center opacity-40 max-w-[140px] leading-relaxed">
                    Amatrix initial state. No temporal snapshots detected.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                        <FaHistory />
                    </div>
                    <div>
                        <h2 className="font-display font-black text-white text-xl uppercase italic tracking-tighter">Event Logan</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-cyan-500" />
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                {versions.length} temporal nodes indexed
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
                <div className="relative">
                    {/* Glowy Timeline line */}
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-cyan-500/60 via-indigo-500/30 to-transparent" />

                    <div className="space-y-12">
                        {sortedVersions.map((version, index) => {
                            const isSelected = selectedVersions.includes(version.id);
                            const isCurrent = currentVersion?.id === version.id;
                            const versionBranchList = versionBranches[version.id] || [];
                            const isMerge = version.mergeParentId !== null;

                            return (
                                <div
                                    key={version.id}
                                    className={`relative pl-10 animate-fadeIn group`}
                                    style={{ animationDelay: `${index * 80}ms` }}
                                >
                                    {/* Timeline dot */}
                                    <div className={`
                                        absolute left-[-2px] top-1.5 w-[26px] h-[26px] rounded-lg rotate-45 border flex items-center justify-center transition-all duration-500 z-10
                                        ${isCurrent
                                            ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                                            : isMerge
                                                ? 'bg-purple-500/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                : isSelected
                                                    ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                                    : 'bg-deep border-white/20 group-hover:border-white/40'
                                        }
                                    `}>
                                        <div className="rotate-[-45deg] scale-75">
                                            {isMerge ? <FaProjectDiagram className="text-white" /> : (isSelected ? <FaCheckSquare className="text-white" /> : <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-deep' : 'bg-white/40'}`} />)}
                                        </div>
                                    </div>

                                    {/* Version card */}
                                    <div className={`
                                        relative p-5 glass-panel transition-all duration-300
                                        ${isCurrent ? 'border-cyan-500/50 bg-cyan-500/[0.03] scale-[1.02]' : 'hover:bg-white/[0.04]'}
                                        ${isSelected ? 'border-indigo-500/50 bg-indigo-500/[0.03]' : ''}
                                    `} onClick={() => onVersionSelect(version.id)}>

                                        {/* Badge/Status */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[9px] font-bold text-muted tracking-tighter uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                                                    ID: {version.id.substring(0, 10)}
                                                </span>
                                                {isMerge && <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest px-1">Merge</span>}
                                            </div>
                                            {isCurrent && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.2em]">Active</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Message */}
                                        <h3 className={`font-display font-semibold text-[15px] leading-snug mb-4 tracking-tight
                                            ${isCurrent ? 'text-white' : 'text-slate-300 group-hover:text-white'}
                                        `}>
                                            {version.message}
                                        </h3>

                                        {/* Metadata Row */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 opacity-60">
                                            <div className="flex items-center gap-1.5">
                                                <FaUser className="text-[10px] text-cyan-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{version.author.split(' ')[0]}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <FaClock className="text-[10px] text-indigo-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{format(new Date(version.timestamp), 'HH:mm')}</span>
                                            </div>
                                        </div>

                                        {/* Branches */}
                                        {versionBranchList.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {versionBranchList.map(branch => (
                                                    <div key={branch} className={`
                                                        px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-[0.1em] bg-white/[0.03]
                                                        ${getBranchColor(branch)}
                                                    `}>
                                                        {branch}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRollback(version.id); }}
                                                className={`flex-1 h-9 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                                                    ${isCurrent ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'}
                                                `}
                                                disabled={isCurrent}
                                            >
                                                <FaUndo className="opacity-60" /> Shift
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onBranchFromVersion(version.id); }}
                                                className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-400/30 text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                <FaCodeBranch className="opacity-60" /> Fork
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
