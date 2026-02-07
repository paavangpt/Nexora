import { useState, useEffect, useCallback, useMemo } from 'react';
import { versionAPI, branchAPI } from '../services/api';
import {
    createVersion as createVersionLocal,
    getDiff,
    mergeVersions,
    findCommonAncestor,
    hasChanges,
} from '../utils/versionControl';

/**
 * Custom hook for managing version control state and operations
 * Uses backend API for persistent storage with localStorage fallback
 */
export function useVersionControl() {
    // Core state
    const [versions, setVersions] = useState([]);
    const [branches, setBranches] = useState({ main: null });
    const [currentBranch, setCurrentBranch] = useState('main');
    const [currentVersion, setCurrentVersion] = useState(null);
    const [currentData, setCurrentData] = useState({});
    const [selectedVersions, setSelectedVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [useLocalStorage, setUseLocalStorage] = useState(false);

    // Load initial data from backend
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Load versions and branches in parallel
            const [versionsRes, branchesRes] = await Promise.all([
                versionAPI.getAll(),
                branchAPI.getAll()
            ]);

            // Transform versions to match frontend format (use versionId as id)
            const transformedVersions = versionsRes.data.map(v => ({
                ...v,
                id: v.versionId
            }));
            setVersions(transformedVersions);

            // Convert branches array to object
            const branchesObj = {};
            branchesRes.data.forEach(branch => {
                branchesObj[branch.name] = branch.versionId;
            });

            // Ensure main branch exists in object
            if (!branchesObj.main && transformedVersions.length === 0) {
                branchesObj.main = null;
            }
            setBranches(branchesObj);

            // Get active branch (don't log error if none exists, just use 'main')
            try {
                const activeRes = await branchAPI.getActive();
                if (!activeRes.data) {
                    throw new Error('No active branch');
                }

                setCurrentBranch(activeRes.data.name);
                if (activeRes.data.version) {
                    const transformedVersion = {
                        ...activeRes.data.version,
                        id: activeRes.data.version.versionId
                    };
                    setCurrentVersion(transformedVersion);
                    setCurrentData(activeRes.data.version?.data || {});
                }
            } catch {
                // No active branch found - this is expected for new databases
                // Silently fallback to 'main' branch
                setCurrentBranch('main');
                // Set current version to latest if available
                if (transformedVersions.length > 0 && branchesObj.main) {
                    const mainVersion = transformedVersions.find(v => v.versionId === branchesObj.main);
                    if (mainVersion) {
                        setCurrentVersion(mainVersion);
                        setCurrentData(mainVersion.data || {});
                    }
                }
            }

            setUseLocalStorage(false);
        } catch (err) {
            console.error('Failed to load from backend, using localStorage fallback:', err);
            setError(err.message);
            // Fallback to localStorage implementation
            loadFromLocalStorage();
            setUseLocalStorage(true);
        } finally {
            setIsLoading(false);
        }
    };

    const loadFromLocalStorage = () => {
        // Import storage utilities dynamically for fallback
        import('../utils/storage').then(({ loadVersions, loadBranches, loadCurrentBranch }) => {
            const storedVersions = loadVersions();
            const storedBranches = loadBranches();
            const storedCurrentBranch = loadCurrentBranch();

            setVersions(storedVersions);
            setBranches(storedBranches);
            setCurrentBranch(storedCurrentBranch);

            if (storedVersions.length > 0) {
                const branchVersionId = storedBranches[storedCurrentBranch];
                const headVersion = storedVersions.find(v => v.id === branchVersionId);
                if (headVersion) {
                    setCurrentVersion(headVersion);
                    setCurrentData(JSON.parse(JSON.stringify(headVersion.data)));
                }
            }
        });
    };

    /**
     * Commit current changes as a new version
     */
    const commitVersion = useCallback(async (message, author = 'User') => {
        if (!message?.trim()) {
            throw new Error('Commit message is required');
        }

        try {
            const parentId = currentVersion?.versionId || currentVersion?.id || null;

            // Create version via API
            const response = await versionAPI.create({
                parentId,
                data: currentData,
                message: message.trim(),
                author
            });

            const newVersion = {
                ...response.data,
                id: response.data.versionId
            };

            // Update local state
            setVersions(prev => [newVersion, ...prev]);
            setCurrentVersion(newVersion);
            setSelectedVersions([]);

            // Update branch pointer
            if (currentBranch) {
                try {
                    await branchAPI.update(currentBranch, newVersion.versionId);
                } catch (err) {
                    // Branch might not exist, create it
                    try {
                        await branchAPI.create({ name: currentBranch, versionId: newVersion.versionId });
                    } catch (createErr) {
                        console.error('Failed to update/create branch:', createErr);
                    }
                }
            }

            setBranches(prev => ({
                ...prev,
                [currentBranch]: newVersion.versionId
            }));

            return newVersion;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [currentData, currentVersion, currentBranch]);

    /**
     * Create a new branch from a specific version
     */
    const createBranch = useCallback(async (branchName, fromVersionId) => {
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

        const versionId = fromVersionId || currentVersion?.versionId || currentVersion?.id;
        if (!versionId) {
            throw new Error('No version to branch from');
        }

        const version = versions.find(v => v.versionId === versionId || v.id === versionId);
        if (!version) {
            throw new Error('Source version not found');
        }

        try {
            await branchAPI.create({ name, versionId });
            await branchAPI.setActive(name);

            setBranches(prev => ({
                ...prev,
                [name]: versionId,
            }));
            setCurrentBranch(name);
            setCurrentVersion(version);
            setCurrentData(JSON.parse(JSON.stringify(version.data)));

            return { name, versionId };
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [branches, currentVersion, versions]);

    /**
     * Switch to a different branch
     */
    const switchBranch = useCallback(async (branchName) => {
        if (!branches[branchName]) {
            throw new Error(`Branch "${branchName}" does not exist`);
        }

        try {
            const response = await branchAPI.getOne(branchName);
            const branch = response.data;

            await branchAPI.setActive(branchName);

            setCurrentBranch(branchName);
            if (branch.version) {
                const transformedVersion = {
                    ...branch.version,
                    id: branch.version.versionId
                };
                setCurrentVersion(transformedVersion);
                setCurrentData(branch.version.data || {});
            } else {
                setCurrentVersion(null);
                setCurrentData({});
            }
            setSelectedVersions([]);
        } catch (err) {
            // Fallback to local state
            const versionId = branches[branchName];
            const version = versions.find(v => v.versionId === versionId || v.id === versionId);

            setCurrentBranch(branchName);
            setCurrentVersion(version || null);
            setCurrentData(version ? JSON.parse(JSON.stringify(version.data)) : {});
            setSelectedVersions([]);
        }
    }, [branches, versions]);

    /**
     * Delete a branch
     */
    const deleteBranch = useCallback(async (branchName) => {
        if (branchName === 'main') {
            throw new Error('Cannot delete the main branch');
        }

        if (branchName === currentBranch) {
            throw new Error('Cannot delete the currently active branch');
        }

        if (!branches[branchName]) {
            throw new Error(`Branch "${branchName}" does not exist`);
        }

        try {
            await branchAPI.delete(branchName);

            setBranches(prev => {
                const newBranches = { ...prev };
                delete newBranches[branchName];
                return newBranches;
            });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [branches, currentBranch]);

    /**
     * Rollback to a specific version
     */
    const rollbackToVersion = useCallback(async (versionId) => {
        const version = versions.find(v => v.versionId === versionId || v.id === versionId);

        if (!version) {
            throw new Error('Version not found');
        }

        setCurrentData(JSON.parse(JSON.stringify(version.data)));
    }, [versions]);

    /**
     * Hard rollback - deletes all versions after the target version
     * and updates current branch to point to the target version
     */
    const hardRollback = useCallback(async (targetVersionId) => {
        const targetVersion = versions.find(v => v.versionId === targetVersionId || v.id === targetVersionId);

        if (!targetVersion) {
            throw new Error('Target version not found');
        }

        const targetTimestamp = new Date(targetVersion.timestamp);

        // Find all versions created AFTER the target version
        const versionsToDelete = versions.filter(v => {
            const versionTimestamp = new Date(v.timestamp);
            return versionTimestamp > targetTimestamp;
        });

        if (useLocalStorage) {
            // LocalStorage fallback - just filter out the versions
            const remainingVersions = versions.filter(v => {
                const versionTimestamp = new Date(v.timestamp);
                return versionTimestamp <= targetTimestamp;
            });
            setVersions(remainingVersions);
        } else {
            // Delete versions from backend
            try {
                for (const version of versionsToDelete) {
                    await versionAPI.delete(version.versionId || version.id);
                }
            } catch (error) {
                console.error('Error deleting versions:', error);
            }

            // Reload versions from backend
            const versionsRes = await versionAPI.getAll();
            const transformedVersions = versionsRes.data.map(v => ({
                ...v,
                id: v.versionId
            }));
            setVersions(transformedVersions);
        }

        // Update current branch to point to target version
        const targetId = targetVersion.versionId || targetVersion.id;

        if (useLocalStorage) {
            setBranches(prev => ({
                ...prev,
                [currentBranch]: targetId
            }));
        } else {
            try {
                await branchAPI.update(currentBranch, targetId);
            } catch (error) {
                console.error('Error updating branch:', error);
            }
        }

        // Set current version and data
        setCurrentVersion(targetVersion);
        setCurrentData(JSON.parse(JSON.stringify(targetVersion.data)));
    }, [versions, useLocalStorage, currentBranch]);

    /**
     * Merge two branches
     */
    const mergeBranches = useCallback((sourceBranchName, targetBranchName) => {
        const sourceVersionId = branches[sourceBranchName];
        const targetVersionId = branches[targetBranchName];

        if (!sourceVersionId || !targetVersionId) {
            throw new Error('One or both branches do not have any commits');
        }

        const sourceVersion = versions.find(v => v.versionId === sourceVersionId || v.id === sourceVersionId);
        const targetVersion = versions.find(v => v.versionId === targetVersionId || v.id === targetVersionId);

        if (!sourceVersion || !targetVersion) {
            throw new Error('Could not find versions for branches');
        }

        // Find common ancestor
        const commonAncestor = findCommonAncestor(sourceVersion, targetVersion, versions);

        if (!commonAncestor) {
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
        };
    }, [branches, versions]);

    /**
     * Complete a merge (after conflict resolution if needed)
     */
    const completeMerge = useCallback(async (mergedData, sourceBranchName, sourceVersionId, message) => {
        try {
            const parentId = currentVersion?.versionId || currentVersion?.id || null;

            // Create merge version via API
            const response = await versionAPI.create({
                parentId,
                data: mergedData,
                message: message || `Merge ${sourceBranchName} into ${currentBranch}`,
                author: 'User'
            });

            const mergeVersion = {
                ...response.data,
                id: response.data.versionId
            };

            setVersions(prev => [mergeVersion, ...prev]);

            // Update branch pointer
            if (currentBranch) {
                try {
                    await branchAPI.update(currentBranch, mergeVersion.versionId);
                } catch (err) {
                    console.error('Failed to update branch after merge:', err);
                }
            }

            setBranches(prev => ({
                ...prev,
                [currentBranch]: mergeVersion.versionId,
            }));
            setCurrentVersion(mergeVersion);
            setCurrentData(JSON.parse(JSON.stringify(mergeVersion.data)));

            return mergeVersion;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [currentVersion, currentBranch]);

    /**
     * Update current data (does not save until commit)
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

        const version1 = versions.find(v => v.versionId === selectedVersions[0] || v.id === selectedVersions[0]);
        const version2 = versions.find(v => v.versionId === selectedVersions[1] || v.id === selectedVersions[1]);

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
     * Reset all data
     */
    const resetAll = useCallback(() => {
        setVersions([]);
        setBranches({ main: null });
        setCurrentBranch('main');
        setCurrentVersion(null);
        setCurrentData({});
        setSelectedVersions([]);
    }, []);

    /**
     * Initialize with sample data
     */
    const initWithData = useCallback(async (data, message = 'Initial commit') => {
        try {
            // Create initial version via API
            const response = await versionAPI.create({
                parentId: null,
                data,
                message,
                author: 'User'
            });

            const newVersion = {
                ...response.data,
                id: response.data.versionId
            };

            // Create main branch
            try {
                await branchAPI.create({ name: 'main', versionId: newVersion.versionId });
                await branchAPI.setActive('main');
            } catch (err) {
                // Branch might already exist, try to update
                try {
                    await branchAPI.update('main', newVersion.versionId);
                } catch (updateErr) {
                    console.error('Failed to setup main branch:', updateErr);
                }
            }

            setVersions([newVersion]);
            setBranches({ main: newVersion.versionId });
            setCurrentBranch('main');
            setCurrentVersion(newVersion);
            setCurrentData(JSON.parse(JSON.stringify(data)));
            setSelectedVersions([]);

            return newVersion;
        } catch (err) {
            setError(err.message);
            // Fallback to local creation
            const newVersion = createVersionLocal(data, null, message, 'User');
            setVersions([newVersion]);
            setBranches({ main: newVersion.id });
            setCurrentBranch('main');
            setCurrentVersion(newVersion);
            setCurrentData(JSON.parse(JSON.stringify(data)));
            setSelectedVersions([]);
            return newVersion;
        }
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
        return selectedVersions.map(id =>
            versions.find(v => v.versionId === id || v.id === id)
        ).filter(Boolean);
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
        error,
        useLocalStorage,

        // Actions
        commitVersion,
        createBranch,
        switchBranch,
        deleteBranch,
        rollbackToVersion,
        hardRollback,
        mergeBranches,
        completeMerge,
        updateCurrentData,
        toggleVersionSelection,
        getDiffBetweenSelected,
        resetAll,
        initWithData,
        loadAllData,

        // Computed
        canCommit,
        versionCount,
        branchList,
        selectedVersionObjects,
    };
}
