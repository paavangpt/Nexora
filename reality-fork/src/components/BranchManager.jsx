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
                versionCount: versions.filter(v => {
                    // Simple count - versions that lead to this branch head
                    let current = version;
                    while (current) {
                        if (current.id === v.id) return true;
                        current = versions.find(ver => ver.id === current.parentId);
                    }
                    return false;
                }).length,
            };
        });
        return info;
    }, [branches, versions, branchList]);

    // Branch color mapping
    const getBranchColor = (branchName) => {
        if (branchName === 'main') return 'from-blue-600 to-blue-500';
        const colors = [
            'from-green-600 to-green-500',
            'from-purple-600 to-purple-500',
            'from-orange-600 to-orange-500',
            'from-pink-600 to-pink-500',
            'from-cyan-600 to-cyan-500',
        ];
        const hash = branchName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const handleCreateBranch = () => {
        setError('');

        if (!newBranchName.trim()) {
            setError('Branch name is required');
            return;
        }

        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(newBranchName)) {
            setError('Invalid branch name');
            return;
        }

        try {
            onCreateBranch(newBranchName.trim(), selectedVersion || null);
            setNewBranchName('');
            setSelectedVersion('');
            setShowCreateForm(false);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleMerge = () => {
        setError('');

        if (!sourceBranch) {
            setError('Select a source branch');
            return;
        }

        if (sourceBranch === currentBranch) {
            setError('Cannot merge branch into itself');
            return;
        }

        try {
            onMergeBranch(sourceBranch, currentBranch);
            setSourceBranch('');
            setShowMergeForm(false);
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 lg:p-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-800/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <FaCodeBranch className="text-purple-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-100 text-lg">Reality Branches</h2>
                            <p className="text-xs text-gray-400">
                                {branchList.length} branch{branchList.length !== 1 ? 'es' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 lg:p-5 border-b border-gray-700/30 bg-gray-800/20 flex gap-3">
                <button
                    onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        setShowMergeForm(false);
                        setError('');
                    }}
                    className="btn btn-primary flex-1 text-sm py-2.5"
                >
                    <FaPlus />
                    New Branch
                </button>
                <button
                    onClick={() => {
                        setShowMergeForm(!showMergeForm);
                        setShowCreateForm(false);
                        setError('');
                    }}
                    className="btn btn-secondary flex-1 text-sm py-2.5"
                    disabled={branchList.length < 2}
                >
                    <FaRandom />
                    Merge
                </button>
            </div>

            {/* Create branch form */}
            {showCreateForm && (
                <div className="p-4 border-b border-gray-700 bg-gray-900/50 animate-slideUp">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Create New Branch</h3>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Branch Name</label>
                            <input
                                type="text"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                placeholder="feature-timeline"
                                className="input text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">From Version (optional)</label>
                            <select
                                value={selectedVersion}
                                onChange={(e) => setSelectedVersion(e.target.value)}
                                className="input text-sm"
                            >
                                <option value="">Current version</option>
                                {versions.slice().reverse().map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.message.substring(0, 30)}... ({v.id.substring(0, 8)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs">{error}</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateBranch}
                                className="btn btn-success flex-1 text-sm"
                            >
                                <FaCheck />
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewBranchName('');
                                    setError('');
                                }}
                                className="btn btn-secondary text-sm"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Merge form */}
            {showMergeForm && (
                <div className="p-4 border-b border-gray-700 bg-gray-900/50 animate-slideUp">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Merge Branches</h3>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Source</label>
                                <select
                                    value={sourceBranch}
                                    onChange={(e) => setSourceBranch(e.target.value)}
                                    className="input text-sm"
                                >
                                    <option value="">Select branch...</option>
                                    {branchList.filter(b => b !== currentBranch).map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            <FaExchangeAlt className="text-gray-500 mt-5" />

                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Target</label>
                                <div className="input text-sm bg-gray-800 cursor-not-allowed">
                                    {currentBranch}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs">{error}</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleMerge}
                                className="btn btn-success flex-1 text-sm"
                                disabled={!sourceBranch}
                            >
                                <FaRandom />
                                Merge
                            </button>
                            <button
                                onClick={() => {
                                    setShowMergeForm(false);
                                    setSourceBranch('');
                                    setError('');
                                }}
                                className="btn btn-secondary text-sm"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branch list */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-5">
                <div className="space-y-4">
                    {branchList.map(branchName => {
                        const info = branchInfo[branchName];
                        const isCurrent = branchName === currentBranch;

                        return (
                            <div
                                key={branchName}
                                className={`
                                    p-4 lg:p-5 rounded-xl bg-gray-800/60 border border-gray-700/50
                                    cursor-pointer transition-all duration-300 backdrop-blur-sm
                                    ${isCurrent
                                        ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-gray-900 border-cyan-500/30'
                                        : 'hover:border-gray-600 hover:bg-gray-800/80'
                                    }
                                `}
                                onClick={() => !isCurrent && onSwitchBranch(branchName)}
                            >
                                {/* Branch header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getBranchColor(branchName)} shadow-lg`} />
                                        <span className="font-semibold text-gray-100 text-base">{branchName}</span>
                                    </div>
                                    {isCurrent && (
                                        <span className="text-xs px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full font-medium">
                                            Active
                                        </span>
                                    )}
                                </div>

                                {/* Branch info */}
                                {info.version ? (
                                    <div className="text-sm text-gray-400 space-y-2 mb-4 pb-3 border-b border-gray-700/30">
                                        <p className="truncate">
                                            <span className="text-gray-500">Latest:</span> {info.version.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5">
                                                <FaClock className="text-xs text-gray-500" />
                                                {format(new Date(info.version.timestamp), 'MMM d, HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mb-4 pb-3 border-b border-gray-700/30">No commits yet</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    {!isCurrent && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSwitchBranch(branchName);
                                            }}
                                            className="btn btn-secondary text-sm py-2 px-4"
                                        >
                                            <FaExchangeAlt className="text-xs" />
                                            Switch
                                        </button>
                                    )}

                                    {branchName !== 'main' && !isCurrent && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete branch "${branchName}"?`)) {
                                                    onDeleteBranch(branchName);
                                                }
                                            }}
                                            className="btn btn-danger text-sm py-2 px-4"
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    )}

                                    {isCurrent && (
                                        <span className="text-sm text-gray-500">Current branch</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
