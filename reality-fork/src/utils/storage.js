// Storage utility functions for localStorage persistence
const STORAGE_PREFIX = 'reality-fork-';

const KEYS = {
    VERSIONS: `${STORAGE_PREFIX}versions`,
    BRANCHES: `${STORAGE_PREFIX}branches`,
    CURRENT_BRANCH: `${STORAGE_PREFIX}current-branch`,
    SETTINGS: `${STORAGE_PREFIX}settings`,
};

/**
 * Save versions array to localStorage
 * @param {Array} versions - Array of version objects
 */
export function saveVersions(versions) {
    try {
        const data = JSON.stringify(versions);
        localStorage.setItem(KEYS.VERSIONS, data);
        return true;
    } catch (error) {
        console.error('Failed to save versions:', error);
        return false;
    }
}

/**
 * Load versions from localStorage
 * @returns {Array} Array of version objects, empty array if none exist
 */
export function loadVersions() {
    try {
        const data = localStorage.getItem(KEYS.VERSIONS);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load versions:', error);
        return [];
    }
}

/**
 * Save branches object to localStorage
 * @param {Object} branches - Map of branch names to version IDs
 */
export function saveBranches(branches) {
    try {
        const data = JSON.stringify(branches);
        localStorage.setItem(KEYS.BRANCHES, data);
        return true;
    } catch (error) {
        console.error('Failed to save branches:', error);
        return false;
    }
}

/**
 * Load branches from localStorage
 * @returns {Object} Branches object, defaults to { main: null }
 */
export function loadBranches() {
    try {
        const data = localStorage.getItem(KEYS.BRANCHES);
        if (!data) return { main: null };
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load branches:', error);
        return { main: null };
    }
}

/**
 * Save current branch name to localStorage
 * @param {string} branchName - Current active branch name
 */
export function saveCurrentBranch(branchName) {
    try {
        localStorage.setItem(KEYS.CURRENT_BRANCH, branchName);
        return true;
    } catch (error) {
        console.error('Failed to save current branch:', error);
        return false;
    }
}

/**
 * Load current branch from localStorage
 * @returns {string} Current branch name, defaults to "main"
 */
export function loadCurrentBranch() {
    try {
        const branch = localStorage.getItem(KEYS.CURRENT_BRANCH);
        return branch || 'main';
    } catch (error) {
        console.error('Failed to load current branch:', error);
        return 'main';
    }
}

/**
 * Clear all stored data (for reset functionality)
 */
export function clearAll() {
    try {
        Object.values(KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    } catch (error) {
        console.error('Failed to clear storage:', error);
        return false;
    }
}

/**
 * Get storage info (for debugging and quota checks)
 * @returns {Object} Storage statistics
 */
export function getStorageInfo() {
    try {
        let totalSize = 0;
        Object.values(KEYS).forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                totalSize += data.length * 2; // UTF-16 encoding
            }
        });
        return {
            totalBytes: totalSize,
            totalKB: (totalSize / 1024).toFixed(2),
            totalMB: (totalSize / 1024 / 1024).toFixed(4),
        };
    } catch (error) {
        console.error('Failed to get storage info:', error);
        return { totalBytes: 0, totalKB: '0', totalMB: '0' };
    }
}
