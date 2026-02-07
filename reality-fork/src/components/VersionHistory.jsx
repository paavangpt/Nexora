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
    FaUser
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

    // Branch color mapping
    const branchColors = {
        main: 'text-blue-400 border-blue-500',
        default: 'text-green-400 border-green-500',
    };

    const getBranchColor = (branchName) => {
        if (branchColors[branchName]) return branchColors[branchName];
        const colors = [
            'text-purple-400 border-purple-500',
            'text-orange-400 border-orange-500',
            'text-pink-400 border-pink-500',
            'text-cyan-400 border-cyan-500',
            'text-yellow-400 border-yellow-500',
        ];
        const hash = branchName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    if (versions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6">
                <FaHistory className="text-4xl mb-4 text-gray-600" />
                <p className="text-center">No versions yet</p>
                <p className="text-sm text-center mt-2 text-gray-600">
                    Make changes and commit to create your first reality snapshot
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 lg:p-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-800/40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <FaHistory className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-100 text-lg">Timeline History</h2>
                        <p className="text-xs text-gray-400">
                            {versions.length} version{versions.length !== 1 ? 's' : ''} • Select 2 to compare
                        </p>
                    </div>
                </div>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-5">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500/80 via-purple-500/50 to-transparent rounded-full" />

                    {/* Versions */}
                    <div className="space-y-5">
                        {sortedVersions.map((version, index) => {
                            const isSelected = selectedVersions.includes(version.id);
                            const isCurrent = currentVersion?.id === version.id;
                            const versionBranchList = versionBranches[version.id] || [];
                            const isMerge = version.mergeParentId !== null;

                            return (
                                <div
                                    key={version.id}
                                    className={`
                                        relative pl-12 animate-fadeIn
                                        ${isCurrent ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                                    `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Timeline dot */}
                                    <div
                                        className={`
                                            absolute left-2 top-4 w-6 h-6 rounded-full flex items-center justify-center
                                            transition-all duration-300 ring-2 ring-gray-900
                                            ${isCurrent
                                                ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50'
                                                : isMerge
                                                    ? 'bg-purple-500'
                                                    : 'bg-blue-500'
                                            }
                                        `}
                                    >
                                        {isMerge ? (
                                            <FaProjectDiagram className="text-[10px] text-white" />
                                        ) : (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>

                                    {/* Version card */}
                                    <div
                                        className={`
                                            p-4 lg:p-5 rounded-xl bg-gray-800/60 border border-gray-700/50
                                            cursor-pointer transition-all duration-300 backdrop-blur-sm
                                            ${isCurrent ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'hover:border-gray-600 hover:bg-gray-800/80'}
                                            ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900' : ''}
                                        `}
                                    >
                                        {/* Selection checkbox */}
                                        <div className="flex items-start justify-between mb-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onVersionSelect(version.id);
                                                }}
                                                className="text-gray-400 hover:text-purple-400 transition-colors"
                                                title={isSelected ? 'Deselect for diff' : 'Select for diff'}
                                            >
                                                {isSelected ? (
                                                    <FaCheckSquare className="text-purple-400" />
                                                ) : (
                                                    <FaSquare />
                                                )}
                                            </button>

                                            {isCurrent && (
                                                <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>

                                        {/* Message */}
                                        <h3 className="font-medium text-gray-100 mb-3 line-clamp-2 text-base">
                                            {version.message}
                                        </h3>

                                        {/* Branch labels */}
                                        {versionBranchList.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {versionBranchList.map(branch => (
                                                    <span
                                                        key={branch}
                                                        className={`
                              text-xs px-2 py-0.5 rounded-full border
                              ${getBranchColor(branch)}
                              bg-gray-900/50
                            `}
                                                    >
                                                        <FaCodeBranch className="inline mr-1 text-[10px]" />
                                                        {branch}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4 pb-3 border-b border-gray-700/30">
                                            <span className="flex items-center gap-1.5">
                                                <FaUser className="text-xs text-gray-500" />
                                                {version.author}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <FaClock className="text-xs text-gray-500" />
                                                {format(new Date(version.timestamp), 'MMM d, HH:mm')}
                                            </span>
                                            <span className="font-mono text-gray-500 text-xs">
                                                #{version.id.substring(0, 8)}
                                            </span>
                                            {isMerge && (
                                                <span className="text-purple-400 text-xs">
                                                    • merge
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRollback(version.id);
                                                }}
                                                className="btn btn-secondary text-sm py-2 px-4 flex-1"
                                                disabled={isCurrent}
                                            >
                                                <FaUndo className="text-xs" />
                                                Rollback
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onBranchFromVersion(version.id);
                                                }}
                                                className="btn btn-secondary text-sm py-2 px-4 flex-1"
                                            >
                                                <FaCodeBranch className="text-xs" />
                                                Branch
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
