import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    saveVersions,
    loadVersions,
    saveBranches,
    loadBranches,
    saveCurrentBranch,
    loadCurrentBranch,
} from '../utils/storage';
import {
    createVersion,
    getDiff,
    mergeVersions,
    findCommonAncestor,
    getVersionChain,
    hasChanges,
} from '../utils/versionControl';

/**
 * Custom hook for managing version control state and operations
 */
/**
 * Custom hook for managing version control state and operations
 * @param {string} projectId - The project ID
 */
export function useVersionControl(projectId) {
    // Core state
    const [versions, setVersions] = useState([]);
    const [branches, setBranches] = useState({ main: null });
    const [currentBranch, setCurrentBranch] = useState('main');
    const [currentVersion, setCurrentVersion] = useState(null);
    const [currentData, setCurrentData] = useState({}); // Now generic object or string wrapper
    const [selectedVersions, setSelectedVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage
    useEffect(() => {
        if (!projectId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const storedVersions = loadVersions(projectId);
        const storedBranches = loadBranches(projectId);
        const storedCurrentBranch = loadCurrentBranch(projectId);

        setVersions(storedVersions);
        setBranches(storedBranches);
        setCurrentBranch(storedCurrentBranch);

        // Set current version and data based on branch
        if (storedVersions.length > 0) {
            const branchVersionId = storedBranches[storedCurrentBranch];
            const headVersion = storedVersions.find(v => v.id === branchVersionId);
            if (headVersion) {
                setCurrentVersion(headVersion);
                // Deep clone data to avoid reference issues
                setCurrentData(JSON.parse(JSON.stringify(headVersion.data)));
            } else {
                // If branch points to non-existent version (shouldn't happen), reset
                setCurrentVersion(null);
                setCurrentData({});
            }
        } else {
            setCurrentVersion(null);
            setCurrentData({});
        }

        setIsLoading(false);
    }, [projectId]);

    // Save to localStorage when state changes
    useEffect(() => {
        if (!isLoading && projectId) {
            saveVersions(projectId, versions);
        }
    }, [versions, isLoading, projectId]);

    useEffect(() => {
        if (!isLoading && projectId) {
            saveBranches(projectId, branches);
        }
    }, [branches, isLoading, projectId]);

    useEffect(() => {
        if (!isLoading && projectId) {
            saveCurrentBranch(projectId, currentBranch);
        }
    }, [currentBranch, isLoading, projectId]);

    /**
     * Commit current changes as a new version
     */
    const commitVersion = useCallback((message, author = 'User') => {
        if (!message?.trim()) {
            throw new Error('Commit message is required');
        }

        const parentId = currentVersion?.id || null;
        const newVersion = createVersion(currentData, parentId, message.trim(), author);

        setVersions(prev => [...prev, newVersion]);
        setBranches(prev => ({
            ...prev,
            [currentBranch]: newVersion.id,
        }));
        setCurrentVersion(newVersion);
        setSelectedVersions([]);

        return newVersion;
    }, [currentData, currentVersion, currentBranch]);

    /**
     * Create a new branch from a specific version
     */
    const createBranch = useCallback((branchName, fromVersionId) => {
        const name = branchName?.trim();

        if (!name) {
            throw new Error('Branch name is required');
        }

        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
            throw new Error('Branch name must start with a letter and contain only letters, numbers, hyphens, and underscores');
        }

        if (branches[name]) {
            throw new Error(`Branch "${name}" already exists`);
        }

        const versionId = fromVersionId || currentVersion?.id;
        if (!versionId) {
            throw new Error('No version to branch from');
        }

        const version = versions.find(v => v.id === versionId);
        if (!version) {
            throw new Error('Source version not found');
        }

        setBranches(prev => ({
            ...prev,
            [name]: versionId,
        }));
        setCurrentBranch(name);
        setCurrentVersion(version);
        setCurrentData(JSON.parse(JSON.stringify(version.data)));

        return { name, versionId };
    }, [branches, currentVersion, versions]);

    /**
     * Switch to a different branch
     */
    const switchBranch = useCallback((branchName) => {
        if (!branches[branchName]) {
            throw new Error(`Branch "${branchName}" does not exist`);
        }

        const versionId = branches[branchName];
        const version = versions.find(v => v.id === versionId);

        setCurrentBranch(branchName);
        setCurrentVersion(version || null);
        setCurrentData(version ? JSON.parse(JSON.stringify(version.data)) : {});
        setSelectedVersions([]);
    }, [branches, versions]);

    /**
     * Delete a branch
     */
    const deleteBranch = useCallback((branchName) => {
        if (branchName === 'main') {
            throw new Error('Cannot delete the main branch');
        }

        if (branchName === currentBranch) {
            throw new Error('Cannot delete the currently active branch');
        }

        if (!branches[branchName]) {
            throw new Error(`Branch "${branchName}" does not exist`);
        }

        setBranches(prev => {
            const newBranches = { ...prev };
            delete newBranches[branchName];
            return newBranches;
        });
    }, [branches, currentBranch]);

    /**
     * Rollback to a specific version
     */
    const rollbackToVersion = useCallback((versionId) => {
        const version = versions.find(v => v.id === versionId);

        if (!version) {
            throw new Error('Version not found');
        }

        setCurrentData(JSON.parse(JSON.stringify(version.data)));
        // Note: Does not create a new version - user must commit
    }, [versions]);

    /**
     * Merge two branches
     */
    const mergeBranches = useCallback((sourceBranchName, targetBranchName) => {
        const sourceVersionId = branches[sourceBranchName];
        const targetVersionId = branches[targetBranchName];

        if (!sourceVersionId || !targetVersionId) {
            throw new Error('One or both branches do not have any commits');
        }

        const sourceVersion = versions.find(v => v.id === sourceVersionId);
        const targetVersion = versions.find(v => v.id === targetVersionId);

        if (!sourceVersion || !targetVersion) {
            throw new Error('Could not find versions for branches');
        }

        // Find common ancestor
        const commonAncestor = findCommonAncestor(sourceVersion, targetVersion, versions);

        if (!commonAncestor) {
            // No common ancestor - treat as if merging from empty
            const emptyVersion = { data: {} };
            const result = mergeVersions(emptyVersion, sourceVersion, targetVersion);
            return {
                ...result,
                sourceVersion,
                targetVersion,
                commonAncestor: null,
            };
        }

        const result = mergeVersions(commonAncestor, sourceVersion, targetVersion);

        return {
            ...result,
            sourceVersion,
            targetVersion,
            commonAncestor,
            // If conflict, we might need a way to present it. 
            // Since we moved to generic text, mergeVersions in util might need updates or 
            // if we wrap text in an object, it "might" just work for basic cases, 
            // but text merging usually needs diff3. 
            // For now, we rely on existing merge logic which is object-key based.
            // If data is { content: "text" }, it will likely conflict if both changed.
        };
    }, [branches, versions]);

    /**
     * Complete a merge (after conflict resolution if needed)
     */
    const completeMerge = useCallback((mergedData, sourceBranchName, sourceVersionId, message) => {
        const parentId = currentVersion?.id || null;

        const mergeVersion = createVersion(
            mergedData,
            parentId,
            message || `Merge ${sourceBranchName} into ${currentBranch}`,
            'User',
            sourceVersionId // mergeParentId
        );

        setVersions(prev => [...prev, mergeVersion]);
        setBranches(prev => ({
            ...prev,
            [currentBranch]: mergeVersion.id,
        }));
        setCurrentVersion(mergeVersion);
        setCurrentData(JSON.parse(JSON.stringify(mergeVersion.data)));

        return mergeVersion;
    }, [currentVersion, currentBranch]);

    /**
     * Update current data (does not save to localStorage)
     */
    const updateCurrentData = useCallback((newData) => {
        setCurrentData(newData);
    }, []);

    /**
     * Toggle version selection for diff comparison
     */
    const toggleVersionSelection = useCallback((versionId) => {
        setSelectedVersions(prev => {
            if (prev.includes(versionId)) {
                return prev.filter(id => id !== versionId);
            }
            if (prev.length >= 2) {
                return [prev[1], versionId];
            }
            return [...prev, versionId];
        });
    }, []);

    /**
     * Get diff between selected versions
     */
    const getDiffBetweenSelected = useCallback(() => {
        if (selectedVersions.length !== 2) {
            return null;
        }

        const version1 = versions.find(v => v.id === selectedVersions[0]);
        const version2 = versions.find(v => v.id === selectedVersions[1]);

        if (!version1 || !version2) {
            return null;
        }

        return {
            version1,
            version2,
            diff: getDiff(version1, version2),
        };
    }, [selectedVersions, versions]);

    /**
     * Reset all data (Specific to project)
     */
    const resetAll = useCallback(() => {
        setVersions([]);
        setBranches({ main: null });
        setCurrentBranch('main');
        setCurrentVersion(null);
        setCurrentData({});
        setSelectedVersions([]);
        // We probably don't want to wipe the project itself here, just its data history
    }, []);

    /**
     * Initialize with data
     */
    const initWithData = useCallback((data, message = 'Initial commit') => {
        const newVersion = createVersion(data, null, message, 'User');

        setVersions([newVersion]);
        setBranches({ main: newVersion.id });
        setCurrentBranch('main');
        setCurrentVersion(newVersion);
        setCurrentData(JSON.parse(JSON.stringify(data)));
        setSelectedVersions([]);

        return newVersion;
    }, []);

    // Computed values
    const canCommit = useMemo(() => {
        return hasChanges(currentData, currentVersion);
    }, [currentData, currentVersion]);

    const versionCount = versions.length;

    const branchList = useMemo(() => {
        return Object.keys(branches);
    }, [branches]);

    const selectedVersionObjects = useMemo(() => {
        return selectedVersions.map(id => versions.find(v => v.id === id)).filter(Boolean);
    }, [selectedVersions, versions]);

    return {
        // State
        versions,
        branches,
        currentBranch,
        currentVersion,
        currentData,
        selectedVersions,
        isLoading,

        // Actions
        commitVersion,
        createBranch,
        switchBranch,
        deleteBranch,
        rollbackToVersion,
        mergeBranches,
        completeMerge,
        updateCurrentData,
        toggleVersionSelection,
        getDiffBetweenSelected,
        resetAll,
        initWithData,

        // Computed
        canCommit,
        versionCount,
        branchList,
        selectedVersionObjects,
    };
}
