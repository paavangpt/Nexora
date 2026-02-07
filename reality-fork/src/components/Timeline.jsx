import { useMemo } from 'react';
import { format } from 'date-fns';
import {
    FaCodeBranch,
    FaHistory,
    FaClock,
    FaProjectDiagram,
} from 'react-icons/fa';

/**
 * Timeline component - visual graph of version history
 */
export default function Timeline({
    versions,
    branches,
    currentVersion,
    currentBranch,
    onVersionClick,
}) {
    // Sort versions by timestamp
    const sortedVersions = useMemo(() => {
        return [...versions].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );
    }, [versions]);

    // Group versions by branch path
    const branchPaths = useMemo(() => {
        const paths = {};

        Object.entries(branches).forEach(([branchName, headId]) => {
            if (!headId) return;

            // Walk back through parent chain
            const path = [];
            let currentId = headId;

            while (currentId) {
                const version = versions.find(v => v.id === currentId);
                if (!version) break;
                path.unshift(version);
                currentId = version.parentId;
            }

            paths[branchName] = path;
        });

        return paths;
    }, [branches, versions]);

    // Branch color mapping
    const branchColors = useMemo(() => {
        const colors = {};
        const colorPalette = [
            { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/50' },
            { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/50' },
            { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/50' },
            { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/50' },
            { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-400', glow: 'shadow-pink-500/50' },
            { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-400', glow: 'shadow-cyan-500/50' },
        ];

        Object.keys(branches).forEach((branchName, index) => {
            if (branchName === 'main') {
                colors[branchName] = colorPalette[0];
            } else {
                colors[branchName] = colorPalette[(index % (colorPalette.length - 1)) + 1];
            }
        });

        return colors;
    }, [branches]);

    // Get branch name for a version
    const getVersionBranch = (version) => {
        for (const [branchName, path] of Object.entries(branchPaths)) {
            if (path.some(v => v.id === version.id)) {
                return branchName;
            }
        }
        return 'main';
    };

    // Calculate column for each branch
    const branchColumns = useMemo(() => {
        const columns = {};
        let col = 0;

        // Main branch is always column 0
        columns['main'] = col++;

        Object.keys(branches).forEach(branchName => {
            if (branchName !== 'main' && !columns[branchName]) {
                columns[branchName] = col++;
            }
        });

        return columns;
    }, [branches]);

    if (versions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6">
                <FaHistory className="text-4xl mb-4 text-gray-600" />
                <p className="text-center">No timeline to display</p>
                <p className="text-sm text-center mt-2 text-gray-600">
                    Create your first commit to see the timeline
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <FaCodeBranch className="text-cyan-400" />
                    <h2 className="font-semibold text-gray-200">Reality Timeline</h2>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    {versions.length} version{versions.length !== 1 ? 's' : ''} across {Object.keys(branches).length} branch{Object.keys(branches).length !== 1 ? 'es' : ''}
                </p>
            </div>

            {/* Branch legend */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/30 flex flex-wrap gap-2">
                {Object.keys(branches).map(branchName => {
                    const color = branchColors[branchName];
                    const isActive = branchName === currentBranch;

                    return (
                        <div
                            key={branchName}
                            className={`
                flex items-center gap-2 px-2 py-1 rounded-full text-xs
                ${isActive ? 'ring-1 ring-offset-1 ring-offset-gray-900' : ''}
                ${color.border} border bg-gray-900/50
              `}
                        >
                            <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                            <span className={color.text}>{branchName}</span>
                            {isActive && <span className="text-cyan-400">(active)</span>}
                        </div>
                    );
                })}
            </div>

            {/* Timeline graph */}
            <div className="flex-1 overflow-auto p-4">
                <div className="relative">
                    {/* Column lines */}
                    <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
                        {Object.entries(branchColumns).map(([branchName, col]) => {
                            const color = branchColors[branchName];
                            return (
                                <div
                                    key={branchName}
                                    className={`absolute top-0 bottom-0 w-0.5 ${color.bg} opacity-30`}
                                    style={{ left: `${col * 60 + 20}px` }}
                                />
                            );
                        })}
                    </div>

                    {/* Version nodes */}
                    <div className="space-y-6">
                        {sortedVersions.map((version, index) => {
                            const branchName = getVersionBranch(version);
                            const color = branchColors[branchName] || branchColors['main'];
                            const column = branchColumns[branchName] || 0;
                            const isCurrent = currentVersion?.id === version.id;
                            const isMerge = version.mergeParentId !== null;

                            return (
                                <div
                                    key={version.id}
                                    className="relative flex items-start"
                                    style={{ paddingLeft: `${column * 60}px` }}
                                >
                                    {/* Connection line to parent */}
                                    {version.parentId && (
                                        <div
                                            className={`absolute w-0.5 ${color.bg} opacity-50`}
                                            style={{
                                                left: `${column * 60 + 20}px`,
                                                top: '-24px',
                                                height: '24px',
                                            }}
                                        />
                                    )}

                                    {/* Node */}
                                    <div
                                        onClick={() => onVersionClick(version)}
                                        className={`
                      flex items-start gap-3 cursor-pointer
                      transition-all duration-300 hover:scale-105
                    `}
                                    >
                                        {/* Version dot */}
                                        <div
                                            className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${color.bg} ${isCurrent ? `shadow-lg ${color.glow}` : ''}
                        transition-all duration-300
                      `}
                                        >
                                            {isMerge ? (
                                                <FaProjectDiagram className="text-white text-sm" />
                                            ) : (
                                                <FaCodeBranch className="text-white text-sm" />
                                            )}
                                        </div>

                                        {/* Version info */}
                                        <div
                                            className={`
                        card py-2 px-3 min-w-[200px] max-w-[300px]
                        ${isCurrent ? `border-2 ${color.border} glow-blue` : 'hover:border-gray-600'}
                      `}
                                        >
                                            <p className="font-medium text-gray-200 text-sm truncate">
                                                {version.message}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <FaClock className="text-[10px]" />
                                                {format(new Date(version.timestamp), 'MMM d, HH:mm')}
                                            </div>
                                            <div className="text-xs text-gray-600 font-mono mt-1">
                                                {version.id.substring(0, 8)}
                                            </div>
                                            {isCurrent && (
                                                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Merge connector */}
                                    {isMerge && (
                                        <div
                                            className="absolute w-8 h-0.5 bg-purple-500 opacity-50"
                                            style={{
                                                left: `${column * 60 + 40}px`,
                                                top: '20px',
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
