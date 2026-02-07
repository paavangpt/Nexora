import { useState, useEffect, useCallback, useRef } from 'react';
import { FaCode, FaAlignLeft, FaPlus, FaCheckCircle, FaExclamationTriangle, FaTerminal, FaSave } from 'react-icons/fa';

/**
 * JSON Editor component with high-tech terminal aesthetics
 */
export default function Editor({ data, onChange, onCommit, canCommit, currentBranch, readOnly = false }) {
    const [textValue, setTextValue] = useState('');
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(true);
    const [lineCount, setLineCount] = useState(1);
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef(null);

    // Sync text value with data prop
    useEffect(() => {
        try {
            const formatted = JSON.stringify(data, null, 2);
            setTextValue(formatted);
            setError(null);
            setIsValid(true);
            setLineCount(formatted.split('\n').length);
            setCharCount(formatted.length);
        } catch (e) {
            setTextValue('{}');
            setError('Invalid data received');
            setIsValid(false);
        }
    }, [data]);

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setTextValue(value);
        setCharCount(value.length);
        setLineCount(value.split('\n').length);

        // Validate JSON
        try {
            const parsed = JSON.parse(value);
            setError(null);
            setIsValid(true);
            onChange(parsed);
        } catch (e) {
            setError(`${e.message}`);
            setIsValid(false);
        }
    }, [onChange]);

    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(textValue);
            const formatted = JSON.stringify(parsed, null, 2);
            setTextValue(formatted);
            setError(null);
            setIsValid(true);
            setLineCount(formatted.split('\n').length);
            setCharCount(formatted.length);
            onChange(parsed);
        } catch (e) {
            setError(`Format failure: ${e.message}`);
        }
    }, [textValue, onChange]);

    const handleAddField = useCallback(() => {
        try {
            const parsed = JSON.parse(textValue);
            const newKey = `node_${Date.now().toString(36).slice(-4)}`;
            parsed[newKey] = 'null';
            const formatted = JSON.stringify(parsed, null, 2);
            setTextValue(formatted);
            setError(null);
            setIsValid(true);
            setLineCount(formatted.split('\n').length);
            setCharCount(formatted.length);
            onChange(parsed);
        } catch (e) {
            setError(`Append failure: ${e.message}`);
        }
    }, [textValue, onChange]);

    // Sync line numbers scrolling
    const lineNumbersRef = useRef(null);
    const handleScroll = (e) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
    };

    return (
        <div className="h-full flex flex-col bg-deep selection:bg-cyan-500/30">
            {/* Upper Context Bar */}
            <div className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-6">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                        <FaTerminal className="text-sm" />
                    </div>
                    <div>
                        <h2 className="font-display font-black text-white text-sm uppercase italic tracking-widest leading-none">Matrix_Terminal</h2>
                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Active Sync: {currentBranch}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!readOnly && (
                        <>
                            <button onClick={handleAddField} disabled={!isValid} className="h-8 px-4 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all disabled:opacity-20">
                                <FaPlus /> Node
                            </button>
                            <button onClick={handleFormat} disabled={!isValid} className="h-8 px-4 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all disabled:opacity-20">
                                <FaAlignLeft /> Format
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button onClick={onCommit} disabled={!canCommit} className="h-8 px-4 flex items-center gap-2 rounded-lg bg-accent-success/10 hover:bg-accent-success/20 border border-accent-success/20 text-[10px] font-black uppercase text-accent-success transition-all disabled:opacity-20">
                                <FaSave /> Snapshot
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-6 py-2 bg-accent-danger/10 border-b border-accent-danger/20 text-accent-danger text-[10px] font-black uppercase tracking-widest animate-fadeIn flex items-center gap-3">
                    <FaExclamationTriangle />
                    <span>Sequence Error: {error}</span>
                </div>
            )}

            {/* Editor Core */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Line Numbers */}
                <div
                    ref={lineNumbersRef}
                    className="w-16 bg-black/40 border-r border-white/5 overflow-hidden select-none pointer-events-none"
                >
                    <div className="py-10 px-6 font-mono text-[11px] text-slate-600 text-right space-y-[0px]">
                        {Array.from({ length: lineCount }).map((_, i) => (
                            <div key={i} className="h-6 leading-6 tabular-nums">{i + 1}</div>
                        ))}
                    </div>
                </div>

                {/* Textarea */}
                <div className="flex-1 relative bg-black/20">
                    <textarea
                        ref={textareaRef}
                        value={textValue}
                        onChange={handleChange}
                        onScroll={handleScroll}
                        readOnly={readOnly}
                        spellCheck={false}
                        placeholder={readOnly ? "// Read-only interface" : "// Initialize matrix data..."}
                        className={`
                            w-full h-full resize-none py-10 px-10
                            bg-transparent text-slate-300
                            font-mono text-[13px] leading-6
                            focus:outline-none transition-colors
                            ${readOnly ? 'cursor-not-allowed opacity-50' : 'focus:text-white'}
                        `}
                    />

                    {/* Visual Overlay Particles/Grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                    />
                </div>
            </div>

            {/* Metrics Bar */}
            <div className="h-11 px-8 border-t border-white/5 flex items-center justify-between bg-black/40 text-[9px] font-black uppercase tracking-[0.2em]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-muted">Rows:</span>
                        <span className="text-cyan-400 font-mono">{lineCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted">Bytes:</span>
                        <span className="text-indigo-400 font-mono">{charCount}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isValid ? (
                        <div className="flex items-center gap-2 text-accent-success">
                            <FaCheckCircle className="text-[10px]" />
                            <span>integrity_verified</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-accent-danger">
                            <FaExclamationTriangle className="text-[10px]" />
                            <span>matrix_corruption</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
