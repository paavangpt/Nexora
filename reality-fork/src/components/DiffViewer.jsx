import { useState, useMemo } from 'react';
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
} from 'react-icons/fa';

/**
 * Diff Viewer component - compare two versions
 */
export default function DiffViewer({ version1, version2, diff, onClose }) {
    const [showUnchanged, setShowUnchanged] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, added, removed, modified

    const {
        added = {},
        removed = {},
        modified = {},
        unchanged = {},
    } = diff || {};

    // Count changes
    const counts = {
        added: Object.keys(added).length,
        removed: Object.keys(removed).length,
        modified: Object.keys(modified).length,
        unchanged: Object.keys(unchanged).length,
    };

    const totalChanges = counts.added + counts.removed + counts.modified;

    // Filter keys based on search and filter type
    const filterKeys = (obj, type) => {
        let keys = Object.keys(obj);

        if (searchTerm) {
            keys = keys.filter(key =>
                key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                JSON.stringify(obj[key]).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterType !== 'all' && filterType !== type) {
            return [];
        }

        return keys;
    };

    const filteredAdded = filterKeys(added, 'added');
    const filteredRemoved = filterKeys(removed, 'removed');
    const filteredModified = filterKeys(modified, 'modified');
    const filteredUnchanged = showUnchanged ? filterKeys(unchanged, 'unchanged') : [];

    // Format value for display
    const formatValue = (value) => {
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    // Copy diff to clipboard
    const copyDiff = () => {
        const diffText = [
            `Comparing versions:`,
            `- Version 1: ${version1?.message} (${version1?.id?.substring(0, 8)})`,
            `- Version 2: ${version2?.message} (${version2?.id?.substring(0, 8)})`,
            '',
            `=== Added (${counts.added}) ===`,
            ...Object.entries(added).map(([k, v]) => `+ ${k}: ${formatValue(v)}`),
            '',
            `=== Removed (${counts.removed}) ===`,
            ...Object.entries(removed).map(([k, v]) => `- ${k}: ${formatValue(v)}`),
            '',
            `=== Modified (${counts.modified}) ===`,
            ...Object.entries(modified).map(([k, v]) =>
                `~ ${k}:\n  Before: ${formatValue(v.before)}\n  After: ${formatValue(v.after)}`
            ),
        ].join('\n');

        navigator.clipboard.writeText(diffText);
    };

    if (!version1 || !version2) {
        return (
            <div className="modal-overlay animate-fadeIn" onClick={onClose}>
                <div className="glass-panel p-8 text-center" onClick={e => e.stopPropagation()}>
                    <p className="text-gray-400">Select two versions to compare</p>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay animate-fadeIn" onClick={onClose}>
            <div
                className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-100">Reality Diff Analyzer</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                            <FaTimes className="text-xl" />
                        </button>
                    </div>

                    {/* Version comparison header */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex-1 p-3 bg-gray-900/50 rounded-lg">
                            <div className="text-gray-400 text-xs mb-1">Version 1</div>
                            <div className="font-medium text-gray-200 truncate">{version1.message}</div>
                            <div className="text-xs text-gray-500">
                                {format(new Date(version1.timestamp), 'MMM d, yyyy HH:mm')}
                            </div>
                        </div>

                        <FaArrowRight className="text-gray-500 flex-shrink-0" />

                        <div className="flex-1 p-3 bg-gray-900/50 rounded-lg">
                            <div className="text-gray-400 text-xs mb-1">Version 2</div>
                            <div className="font-medium text-gray-200 truncate">{version2.message}</div>
                            <div className="text-xs text-gray-500">
                                {format(new Date(version2.timestamp), 'MMM d, yyyy HH:mm')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-700 bg-gray-800/30">
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search fields..."
                                className="input pl-10 text-sm"
                            />
                        </div>

                        {/* Filter buttons */}
                        <div className="flex gap-1">
                            {[
                                { key: 'all', label: 'All', count: totalChanges },
                                { key: 'added', label: '+', count: counts.added, color: 'text-green-400' },
                                { key: 'removed', label: '-', count: counts.removed, color: 'text-red-400' },
                                { key: 'modified', label: '~', count: counts.modified, color: 'text-yellow-400' },
                            ].map(({ key, label, count, color }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterType(key)}
                                    className={`
                    px-3 py-1 rounded text-sm font-medium transition-colors
                    ${filterType === key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                        }
                  `}
                                >
                                    <span className={color}>{label}</span>
                                    <span className="ml-1 text-xs">({count})</span>
                                </button>
                            ))}
                        </div>

                        {/* Toggle unchanged */}
                        <button
                            onClick={() => setShowUnchanged(!showUnchanged)}
                            className="btn btn-secondary text-sm"
                        >
                            {showUnchanged ? <FaEyeSlash /> : <FaEye />}
                            Unchanged ({counts.unchanged})
                        </button>

                        {/* Copy button */}
                        <button onClick={copyDiff} className="btn btn-secondary text-sm">
                            <FaCopy />
                            Copy
                        </button>
                    </div>
                </div>

                {/* Diff content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {totalChanges === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FaEquals className="text-4xl mb-4 mx-auto" />
                            <p>These versions are identical</p>
                        </div>
                    ) : (
                        <>
                            {/* Added fields */}
                            {filteredAdded.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-green-400 flex items-center gap-2">
                                        <FaPlus /> Added Fields
                                    </h3>
                                    {filteredAdded.map(key => (
                                        <div key={key} className="diff-added p-3 rounded-lg code-editor">
                                            <span className="text-green-400 font-medium">{key}:</span>{' '}
                                            <span className="text-green-300">{formatValue(added[key])}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Removed fields */}
                            {filteredRemoved.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                                        <FaMinus /> Removed Fields
                                    </h3>
                                    {filteredRemoved.map(key => (
                                        <div key={key} className="diff-removed p-3 rounded-lg code-editor">
                                            <span className="text-red-400 font-medium">{key}:</span>{' '}
                                            <span className="text-red-300">{formatValue(removed[key])}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Modified fields */}
                            {filteredModified.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                                        <FaArrowRight /> Modified Fields
                                    </h3>
                                    {filteredModified.map(key => (
                                        <div key={key} className="diff-modified p-3 rounded-lg">
                                            <div className="font-medium text-yellow-400 mb-2">{key}</div>
                                            <div className="grid grid-cols-2 gap-4 code-editor text-sm">
                                                <div className="p-2 bg-red-500/10 rounded border border-red-500/30">
                                                    <div className="text-xs text-red-400 mb-1">Before</div>
                                                    <div className="text-red-300">{formatValue(modified[key].before)}</div>
                                                </div>
                                                <div className="p-2 bg-green-500/10 rounded border border-green-500/30">
                                                    <div className="text-xs text-green-400 mb-1">After</div>
                                                    <div className="text-green-300">{formatValue(modified[key].after)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Unchanged fields */}
                            {showUnchanged && filteredUnchanged.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <FaEquals /> Unchanged Fields
                                    </h3>
                                    {filteredUnchanged.map(key => (
                                        <div key={key} className="p-3 rounded-lg bg-gray-800/50 code-editor text-gray-500">
                                            <span className="font-medium">{key}:</span>{' '}
                                            <span>{formatValue(unchanged[key])}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>
                            {counts.added} added • {counts.removed} removed • {counts.modified} modified
                        </span>
                        <button onClick={onClose} className="btn btn-primary">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
