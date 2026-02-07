import { useState } from 'react';
import { format } from 'date-fns';
import {
    FaPlus,
    FaMinus,
    FaArrowRight,
    FaEquals,
    FaCopy,
    FaEyeSlash,
    FaEye,
    FaSearch,
    FaTimes,
    FaDatabase,
} from 'react-icons/fa';

/**
 * Diff Viewer component - premium temporal analysis interface
 */
export default function DiffViewer({ version1, version2, diff, onClose }) {
    const [showUnchanged, setShowUnchanged] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const {
        added = {},
        removed = {},
        modified = {},
        unchanged = {},
    } = diff || {};

    const counts = {
        added: Object.keys(added).length,
        removed: Object.keys(removed).length,
        modified: Object.keys(modified).length,
        unchanged: Object.keys(unchanged).length,
    };

    const totalChanges = counts.added + counts.removed + counts.modified;

    const filterKeys = (obj, type) => {
        let keys = Object.keys(obj);
        if (searchTerm) {
            keys = keys.filter(key =>
                key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                JSON.stringify(obj[key]).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterType !== 'all' && filterType !== type) return [];
        return keys;
    };

    const filteredAdded = filterKeys(added, 'added');
    const filteredRemoved = filterKeys(removed, 'removed');
    const filteredModified = filterKeys(modified, 'modified');
    const filteredUnchanged = showUnchanged ? filterKeys(unchanged, 'unchanged') : [];

    const formatValue = (value) => {
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    const copyDiff = () => {
        const diffText = JSON.stringify(diff, null, 2);
        navigator.clipboard.writeText(diffText);
    };

    return (
        <div className="flex flex-col h-full animate-fadeIn">
            {/* Analyzer Header */}
            <div className="px-8 py-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                            <FaDatabase />
                        </div>
                        <div>
                            <h2 className="font-display font-black text-white text-2xl uppercase italic tracking-tighter">Vector_Analysis</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1">Delta comparison: temporal nodes alpha & beta</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                        <FaTimes />
                    </button>
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-8">
                    <div className="p-5 glass-panel border-cyan-500/20 bg-cyan-500/[0.02]">
                        <span className="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest mb-1 block">Vector A (Static)</span>
                        <h3 className="font-display font-bold text-white text-sm line-clamp-1">{version1.message}</h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">{format(new Date(version1.timestamp), 'HH:mm:ss')}</p>
                    </div>
                    <FaArrowRight className="text-white/10 text-xl" />
                    <div className="p-5 glass-panel border-indigo-500/20 bg-indigo-500/[0.02]">
                        <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest mb-1 block">Vector B (Active)</span>
                        <h3 className="font-display font-bold text-white text-sm line-clamp-1">{version2.message}</h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">{format(new Date(version2.timestamp), 'HH:mm:ss')}</p>
                    </div>
                </div>
            </div>

            {/* Analysis Toolbar */}
            <div className="px-8 py-4 border-b border-white/5 flex items-center gap-6 bg-black/20">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter matrix fields..."
                        className="input h-11 pl-12 bg-black/40 border-white/5 text-xs font-mono"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {[
                        { k: 'all', l: 'All', c: totalChanges, color: 'text-white' },
                        { k: 'added', l: 'Plus', c: counts.added, color: 'text-accent-success' },
                        { k: 'removed', l: 'Minus', c: counts.removed, color: 'text-accent-danger' },
                        { k: 'modified', l: 'Delta', c: counts.modified, color: 'text-accent-warning' }
                    ].map(f => (
                        <button
                            key={f.k}
                            onClick={() => setFilterType(f.k)}
                            className={`h-11 px-4 rounded-xl flex items-center gap-2 border transition-all ${filterType === f.k ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest ${f.color}`}>{f.l}</span>
                            <span className="text-[10px] font-mono opacity-50">[{f.c}]</span>
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-white/10" />

                <button onClick={() => setShowUnchanged(!showUnchanged)} className={`h-11 px-4 rounded-xl flex items-center gap-2 border transition-all ${showUnchanged ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                    {showUnchanged ? <FaEyeSlash /> : <FaEye />}
                    <span className="text-[10px] font-black uppercase tracking-widest">Static</span>
                </button>

                <button onClick={copyDiff} className="btn btn-secondary h-11 px-5 border-white/5 uppercase text-[10px] tracking-widest">
                    <FaCopy /> Copy
                </button>
            </div>

            {/* Matrix Diff Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-black/10">
                {totalChanges === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-6">
                            <FaEquals className="text-2xl text-slate-600" />
                        </div>
                        <h3 className="font-display font-bold text-white uppercase tracking-widest text-sm italic">Temporal Parity</h3>
                        <p className="text-[11px] text-slate-500 mt-2">Both operational nodes contain identical data states.</p>
                    </div>
                ) : (
                    <>
                        {filteredAdded.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-accent-success uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                                    <FaPlus /> New Allocations
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredAdded.map(key => (
                                        <div key={key} className="p-4 rounded-2xl bg-accent-success/[0.03] border border-accent-success/20 group hover:border-accent-success/40 transition-all">
                                            <div className="text-[11px] font-mono text-accent-success/60 mb-2 uppercase tracking-tighter">Field: {key}</div>
                                            <pre className="text-xs font-mono text-accent-success whitespace-pre-wrap leading-relaxed">{formatValue(added[key])}</pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredRemoved.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-accent-danger uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                                    <FaMinus /> Field Purges
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredRemoved.map(key => (
                                        <div key={key} className="p-4 rounded-2xl bg-accent-danger/[0.03] border border-accent-danger/20 group hover:border-accent-danger/40 transition-all">
                                            <div className="text-[11px] font-mono text-accent-danger/60 mb-2 uppercase tracking-tighter">Field: {key}</div>
                                            <pre className="text-xs font-mono text-accent-danger whitespace-pre-wrap leading-relaxed">{formatValue(removed[key])}</pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredModified.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-accent-warning uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                                    <FaArrowRight /> State Shifts
                                </h4>
                                <div className="space-y-4">
                                    {filteredModified.map(key => (
                                        <div key={key} className="p-6 rounded-2xl bg-accent-warning/[0.03] border border-accent-warning/20 group hover:border-accent-warning/40 transition-all">
                                            <div className="text-[11px] font-mono text-accent-warning/60 mb-4 uppercase tracking-tighter font-black italic">{key}</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-black text-accent-danger/50 uppercase tracking-widest pl-2">Previous State</span>
                                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-400 whitespace-pre-wrap">{formatValue(modified[key].before)}</div>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-black text-accent-success/50 uppercase tracking-widest pl-2">Current State</span>
                                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-white whitespace-pre-wrap">{formatValue(modified[key].after)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showUnchanged && filteredUnchanged.length > 0 && (
                            <div className="space-y-4 pt-10 border-t border-white/5">
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                                    <FaEquals /> Synchronized Pairs
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 opacity-40">
                                    {filteredUnchanged.map(key => (
                                        <div key={key} className="p-3 rounded-xl border border-white/10 bg-white/5">
                                            <div className="text-[9px] font-mono text-slate-500 mb-1 truncate">{key}</div>
                                            <div className="text-[10px] font-mono text-slate-400 line-clamp-1">{formatValue(unchanged[key])}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
