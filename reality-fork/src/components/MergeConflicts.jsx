import { useState, useMemo } from 'react';
import {
    FaExclamationTriangle,
    FaCheck,
    FaTimes,
    FaArrowRight,
    FaEdit,
    FaShieldAlt,
} from 'react-icons/fa';

/**
 * Merge Conflicts component - High-stakes temporal resolution interface
 */
export default function MergeConflicts({
    conflicts,
    sourceBranch,
    targetBranch,
    onResolve,
    onCancel,
}) {
    const [resolutions, setResolutions] = useState(() => {
        const initial = {};
        conflicts.forEach(conflict => {
            initial[conflict.key] = { choice: null, customValue: '' };
        });
        return initial;
    });

    const resolvedCount = useMemo(() => {
        return Object.values(resolutions).filter(r => r.choice !== null).length;
    }, [resolutions]);

    const allResolved = resolvedCount === conflicts.length;

    const setResolution = (key, choice, customValue = '') => {
        setResolutions(prev => ({
            ...prev,
            [key]: { choice, customValue },
        }));
    };

    const setCustomValue = (key, value) => {
        setResolutions(prev => ({
            ...prev,
            [key]: { ...prev[key], customValue: value },
        }));
    };

    const handleResolve = () => {
        if (!allResolved) return;
        const resolvedData = {};
        conflicts.forEach(conflict => {
            const resolution = resolutions[conflict.key];
            if (resolution.choice === 'value1') resolvedData[conflict.key] = conflict.value1;
            else if (resolution.choice === 'value2') resolvedData[conflict.key] = conflict.value2;
            else if (resolution.choice === 'custom') {
                try { resolvedData[conflict.key] = JSON.parse(resolution.customValue); }
                catch { resolvedData[conflict.key] = resolution.customValue; }
            }
        });
        onResolve({ resolvedData });
    };

    const formatValue = (v) => {
        if (v === undefined) return 'VOID';
        if (typeof v === 'object') return JSON.stringify(v, null, 2);
        return String(v);
    };

    return (
        <div className="modal-overlay animate-fadeIn" onClick={onCancel}>
            <div className="glass-panel w-full max-w-5xl h-[90vh] flex flex-col m-4 overflow-hidden animate-slideRight" onClick={e => e.stopPropagation()}>
                {/* Protocol Header */}
                <div className="px-8 py-10 border-b border-accent-warning/20 bg-accent-warning/[0.03]">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-accent-warning/20 flex items-center justify-center text-accent-warning text-3xl shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                            <FaExclamationTriangle />
                        </div>
                        <div>
                            <h2 className="font-display font-black text-white text-3xl uppercase italic tracking-tighter">Temporal_Overlap</h2>
                            <p className="text-[11px] font-bold text-accent-warning/60 uppercase tracking-[0.3em] mt-1 italic">Resolution Protocol: Critical Parity Failure</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex-1 text-center">
                            <span className="text-[9px] font-black text-accent-success uppercase tracking-widest block mb-1">Source Vector</span>
                            <span className="font-display font-bold text-white uppercase italic">{sourceBranch}</span>
                        </div>
                        <FaArrowRight className="text-white/20" />
                        <div className="flex-1 text-center">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block mb-1">Target Vector</span>
                            <span className="font-display font-bold text-white uppercase italic">{targetBranch}</span>
                        </div>
                    </div>
                </div>

                {/* Status Progress */}
                <div className="px-8 py-4 border-b border-white/5 bg-black/20 flex items-center gap-6">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Integrity Restoration</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <div
                            className="h-full bg-gradient-to-r from-accent-warning via-accent-success to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                            style={{ width: `${(resolvedCount / conflicts.length) * 100}%` }}
                        />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-white">[{resolvedCount}/{conflicts.length}]</span>
                </div>

                {/* Overlap List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-black/10">
                    {conflicts.map((conflict, index) => {
                        const resolution = resolutions[conflict.key];
                        const isResolved = resolution.choice !== null;

                        return (
                            <div key={conflict.key} className={`
                                p-8 rounded-3xl border transition-all duration-500
                                ${isResolved ? 'bg-accent-success/[0.03] border-accent-success/20' : 'bg-accent-warning/[0.03] border-accent-warning/20'}
                            `}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isResolved ? 'bg-accent-success text-deep shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'bg-accent-warning text-deep'}`}>
                                            {isResolved ? <FaCheck /> : index + 1}
                                        </div>
                                        <span className="font-display font-black text-white text-lg uppercase italic tracking-tighter">NODE: {conflict.key}</span>
                                    </div>
                                    {isResolved && <span className="text-[10px] font-black uppercase text-accent-success tracking-widest flex items-center gap-2"><FaShieldAlt /> Parity Secure</span>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div
                                        onClick={() => setResolution(conflict.key, 'value1')}
                                        className={`group relative p-6 rounded-2xl cursor-pointer transition-all border ${resolution.choice === 'value1' ? 'border-accent-success bg-accent-success/10 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-accent-success uppercase tracking-widest">Source Sequence</span>
                                            <div className={`w-4 h-4 rounded-full border-2 border-accent-success flex items-center justify-center ${resolution.choice === 'value1' ? 'bg-accent-success' : ''}`}>
                                                {resolution.choice === 'value1' && <FaCheck className="text-[8px] text-deep" />}
                                            </div>
                                        </div>
                                        <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">{formatValue(conflict.value1)}</pre>
                                    </div>

                                    <div
                                        onClick={() => setResolution(conflict.key, 'value2')}
                                        className={`group relative p-6 rounded-2xl cursor-pointer transition-all border ${resolution.choice === 'value2' ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Target Sequence</span>
                                            <div className={`w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center ${resolution.choice === 'value2' ? 'bg-cyan-400' : ''}`}>
                                                {resolution.choice === 'value2' && <FaCheck className="text-[8px] text-deep" />}
                                            </div>
                                        </div>
                                        <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">{formatValue(conflict.value2)}</pre>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl border transition-all ${resolution.choice === 'custom' ? 'border-accent-tertiary bg-accent-tertiary/10' : 'border-white/5 bg-black/20'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <input
                                            type="radio"
                                            checked={resolution.choice === 'custom'}
                                            onChange={() => setResolution(conflict.key, 'custom', resolution.customValue)}
                                            className="w-4 h-4 accent-accent-tertiary"
                                        />
                                        <span className="text-[10px] font-black text-accent-tertiary uppercase tracking-widest flex items-center gap-2"><FaEdit /> Manual Override</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={resolution.customValue}
                                        onChange={(e) => setCustomValue(conflict.key, e.target.value)}
                                        onFocus={() => setResolution(conflict.key, 'custom', resolution.customValue)}
                                        placeholder="Synthesize custom value..."
                                        className="input h-11 bg-black/40 border-white/5 text-xs font-mono"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Complete Action */}
                <div className="px-8 py-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${allResolved ? 'bg-accent-success' : 'bg-accent-warning animate-pulse'}`} />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{allResolved ? 'Resolution Path Confirmed' : 'Action Required: Resolve Remaining Overlaps'}</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onCancel} className="btn btn-secondary h-12 px-8 uppercase text-[10px] tracking-widest text-slate-400">Abort Merge</button>
                        <button
                            onClick={handleResolve}
                            disabled={!allResolved}
                            className={`btn h-12 px-12 uppercase text-[10px] tracking-widest font-black transition-all ${allResolved ? 'bg-accent-success text-deep shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:scale-105' : 'bg-white/5 text-slate-600 disabled:opacity-50'}`}
                        >
                            Commit Integration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
