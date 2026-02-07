import { useState, useMemo } from 'react';
import {
    FaExclamationTriangle,
    FaCheck,
    FaTimes,
    FaArrowRight,
    FaEdit,
} from 'react-icons/fa';

/**
 * Merge Conflicts component - resolve merge conflicts
 */
export default function MergeConflicts({
    conflicts,
    sourceBranch,
    targetBranch,
    onResolve,
    onCancel,
}) {
    // Track resolutions: { key: 'value1' | 'value2' | 'custom', customValue: any }
    const [resolutions, setResolutions] = useState(() => {
        const initial = {};
        conflicts.forEach(conflict => {
            initial[conflict.key] = { choice: null, customValue: '' };
        });
        return initial;
    });

    // Count resolved conflicts
    const resolvedCount = useMemo(() => {
        return Object.values(resolutions).filter(r => r.choice !== null).length;
    }, [resolutions]);

    const allResolved = resolvedCount === conflicts.length;

    // Handle resolution choice
    const setResolution = (key, choice, customValue = '') => {
        setResolutions(prev => ({
            ...prev,
            [key]: { choice, customValue },
        }));
    };

    // Handle custom value change
    const setCustomValue = (key, value) => {
        setResolutions(prev => ({
            ...prev,
            [key]: { ...prev[key], customValue: value },
        }));
    };

    // Complete resolution
    const handleResolve = () => {
        if (!allResolved) return;

        const resolvedData = {};
        conflicts.forEach(conflict => {
            const resolution = resolutions[conflict.key];
            if (resolution.choice === 'value1') {
                resolvedData[conflict.key] = conflict.value1;
            } else if (resolution.choice === 'value2') {
                resolvedData[conflict.key] = conflict.value2;
            } else if (resolution.choice === 'custom') {
                try {
                    resolvedData[conflict.key] = JSON.parse(resolution.customValue);
                } catch {
                    resolvedData[conflict.key] = resolution.customValue;
                }
            }
        });

        onResolve({ resolvedData });
    };

    // Format value for display
    const formatValue = (value) => {
        if (value === undefined) return 'undefined';
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    return (
        <div className="modal-overlay animate-fadeIn" onClick={onCancel}>
            <div
                className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-700 bg-orange-500/10">
                    <div className="flex items-center gap-3 mb-2">
                        <FaExclamationTriangle className="text-2xl text-orange-400" />
                        <h2 className="text-xl font-bold text-gray-100">Merge Conflicts Detected</h2>
                    </div>
                    <p className="text-sm text-gray-400">
                        Merging <span className="text-green-400 font-medium">{sourceBranch}</span>
                        {' '}<FaArrowRight className="inline" />{' '}
                        <span className="text-blue-400 font-medium">{targetBranch}</span>
                    </p>
                </div>

                {/* Progress bar */}
                <div className="p-4 border-b border-gray-700 bg-gray-800/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">
                            Resolution Progress
                        </span>
                        <span className="text-sm font-medium text-gray-200">
                            {resolvedCount} of {conflicts.length} resolved
                        </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
                            style={{ width: `${(resolvedCount / conflicts.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Conflicts list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conflicts.map((conflict, index) => {
                        const resolution = resolutions[conflict.key];
                        const isResolved = resolution.choice !== null;

                        return (
                            <div
                                key={conflict.key}
                                className={`
                  card border transition-all duration-300
                  ${isResolved
                                        ? 'border-green-500/50 bg-green-500/5'
                                        : 'border-orange-500/50 bg-orange-500/5'
                                    }
                `}
                            >
                                {/* Conflict header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${isResolved ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}
                    `}>
                                            {isResolved ? <FaCheck /> : index + 1}
                                        </span>
                                        <span className="font-mono font-bold text-gray-200">{conflict.key}</span>
                                    </div>
                                    {isResolved && (
                                        <span className="text-xs text-green-400 flex items-center gap-1">
                                            <FaCheck /> Resolved
                                        </span>
                                    )}
                                </div>

                                {/* Values comparison */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* Source value */}
                                    <div
                                        className={`
                      p-3 rounded-lg cursor-pointer transition-all
                      ${resolution.choice === 'value1'
                                                ? 'ring-2 ring-green-500 bg-green-500/20'
                                                : 'bg-gray-800/50 hover:bg-gray-800'
                                            }
                    `}
                                        onClick={() => setResolution(conflict.key, 'value1')}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-green-400 font-medium">
                                                Source ({sourceBranch})
                                            </span>
                                            <input
                                                type="radio"
                                                checked={resolution.choice === 'value1'}
                                                onChange={() => setResolution(conflict.key, 'value1')}
                                                className="accent-green-500"
                                            />
                                        </div>
                                        <pre className="code-editor text-sm text-gray-300 whitespace-pre-wrap">
                                            {formatValue(conflict.value1)}
                                        </pre>
                                    </div>

                                    {/* Target value */}
                                    <div
                                        className={`
                      p-3 rounded-lg cursor-pointer transition-all
                      ${resolution.choice === 'value2'
                                                ? 'ring-2 ring-blue-500 bg-blue-500/20'
                                                : 'bg-gray-800/50 hover:bg-gray-800'
                                            }
                    `}
                                        onClick={() => setResolution(conflict.key, 'value2')}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-blue-400 font-medium">
                                                Target ({targetBranch})
                                            </span>
                                            <input
                                                type="radio"
                                                checked={resolution.choice === 'value2'}
                                                onChange={() => setResolution(conflict.key, 'value2')}
                                                className="accent-blue-500"
                                            />
                                        </div>
                                        <pre className="code-editor text-sm text-gray-300 whitespace-pre-wrap">
                                            {formatValue(conflict.value2)}
                                        </pre>
                                    </div>
                                </div>

                                {/* Custom value option */}
                                <div
                                    className={`
                    p-3 rounded-lg transition-all
                    ${resolution.choice === 'custom'
                                            ? 'ring-2 ring-purple-500 bg-purple-500/20'
                                            : 'bg-gray-800/50'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="radio"
                                            checked={resolution.choice === 'custom'}
                                            onChange={() => setResolution(conflict.key, 'custom', resolution.customValue)}
                                            className="accent-purple-500"
                                        />
                                        <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
                                            <FaEdit /> Custom Value
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={resolution.customValue}
                                        onChange={(e) => setCustomValue(conflict.key, e.target.value)}
                                        onFocus={() => setResolution(conflict.key, 'custom', resolution.customValue)}
                                        placeholder="Enter custom value..."
                                        className="input text-sm font-mono"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                            {allResolved
                                ? '✓ All conflicts resolved'
                                : `${conflicts.length - resolvedCount} conflict${conflicts.length - resolvedCount !== 1 ? 's' : ''} remaining`
                            }
                        </span>
                        <div className="flex gap-3">
                            <button onClick={onCancel} className="btn btn-secondary">
                                <FaTimes /> Cancel Merge
                            </button>
                            <button
                                onClick={handleResolve}
                                disabled={!allResolved}
                                className={`btn ${allResolved ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                            >
                                <FaCheck /> Resolve & Merge
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
