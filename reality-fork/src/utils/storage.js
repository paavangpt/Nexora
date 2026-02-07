// Storage utility functions for localStorage persistence
const STORAGE_PREFIX = 'reality-fork-';

// Static keys
const GLOBAL_KEYS = {
    PROJECTS: `${STORAGE_PREFIX}projects`,
    CURRENT_PROJECT_ID: `${STORAGE_PREFIX}current-project-id`,
    SETTINGS: `${STORAGE_PREFIX}settings`,
};

/**
 * Get project-specific keys
 * @param {string} projectId 
 */
const getProjectKeys = (projectId) => ({
    FILES: `${STORAGE_PREFIX}project-${projectId}-files`,
    CURRENT_FILE_ID: `${STORAGE_PREFIX}project-${projectId}-current-file-id`,
    VERSIONS: `${STORAGE_PREFIX}project-${projectId}-versions`,
    BRANCHES: `${STORAGE_PREFIX}project-${projectId}-branches`,
    CURRENT_BRANCH: `${STORAGE_PREFIX}project-${projectId}-current-branch`,
});

// --- Project Management ---

/**
 * Load all projects
 * @returns {Array} Array of project objects { id, name, createdAt }
 */
export function loadProjects() {
    try {
        const data = localStorage.getItem(GLOBAL_KEYS.PROJECTS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load projects:', error);
        return [];
    }
}

/**
 * Save projects list
 * @param {Array} projects 
 */
export function saveProjects(projects) {
    try {
        localStorage.setItem(GLOBAL_KEYS.PROJECTS, JSON.stringify(projects));
        return true;
    } catch (error) {
        console.error('Failed to save projects:', error);
        return false;
    }
}

/**
 * Get current project ID
 */
export function loadCurrentProjectId() {
    return localStorage.getItem(GLOBAL_KEYS.CURRENT_PROJECT_ID);
}

/**
 * Set current project ID
 * @param {string} id 
 */
export function saveCurrentProjectId(id) {
    localStorage.setItem(GLOBAL_KEYS.CURRENT_PROJECT_ID, id);
}

// --- File Management ---

/**
 * Load files for a project
 * @param {string} projectId
 * @returns {Array} Array of file objects { id, name, createdAt, lastModified }
 */
export function loadFiles(projectId) {
    if (!projectId) return [];
    try {
        const keys = getProjectKeys(projectId);
        const data = localStorage.getItem(keys.FILES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Failed to load files for project ${projectId}:`, error);
        return [];
    }
}

/**
 * Save files list for a project
 * @param {string} projectId
 * @param {Array} files
 */
export function saveFiles(projectId, files) {
    if (!projectId) return false;
    try {
        const keys = getProjectKeys(projectId);
        localStorage.setItem(keys.FILES, JSON.stringify(files));
        return true;
    } catch (error) {
        console.error(`Failed to save files for project ${projectId}:`, error);
        return false;
    }
}

/**
 * Get current file ID for a project
 * @param {string} projectId
 */
export function loadCurrentFileId(projectId) {
    if (!projectId) return null;
    return localStorage.getItem(getProjectKeys(projectId).CURRENT_FILE_ID);
}

/**
 * Set current file ID for a project
 * @param {string} projectId
 * @param {string} fileId
 */
export function saveCurrentFileId(projectId, fileId) {
    if (!projectId) return;
    if (fileId) {
        localStorage.setItem(getProjectKeys(projectId).CURRENT_FILE_ID, fileId);
    } else {
        localStorage.removeItem(getProjectKeys(projectId).CURRENT_FILE_ID);
    }
}

/**
 * Delete a file from a project
 * @param {string} projectId
 * @param {string} fileId
 */
export function deleteFileData(projectId, fileId) {
    if (!projectId || !fileId) return false;
    try {
        // Just remove from files list - version control is project-scoped
        const files = loadFiles(projectId);
        const updatedFiles = files.filter(f => f.id !== fileId);
        saveFiles(projectId, updatedFiles);
        return true;
    } catch (error) {
        console.error(`Failed to delete file data ${fileId}:`, error);
        return false;
    }
}

// --- Project-Scoped Version Control Data ---

/**
 * Save versions array for a project
 * @param {string} projectId
 * @param {Array} versions 
 */
export function saveVersions(projectId, versions) {
    if (!projectId) return false;
    try {
        const keys = getProjectKeys(projectId);
        localStorage.setItem(keys.VERSIONS, JSON.stringify(versions));
        return true;
    } catch (error) {
        console.error(`Failed to save versions for project ${projectId}:`, error);
        return false;
    }
}

/**
 * Load versions for a project
 * @param {string} projectId
 */
export function loadVersions(projectId) {
    if (!projectId) return [];
    try {
        const keys = getProjectKeys(projectId);
        const data = localStorage.getItem(keys.VERSIONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Failed to load versions for project ${projectId}:`, error);
        return [];
    }
}

/**
 * Save branches for a project
 * @param {string} projectId
 * @param {Object} branches 
 */
export function saveBranches(projectId, branches) {
    if (!projectId) return false;
    try {
        const keys = getProjectKeys(projectId);
        localStorage.setItem(keys.BRANCHES, JSON.stringify(branches));
        return true;
    } catch (error) {
        console.error(`Failed to save branches for project ${projectId}:`, error);
        return false;
    }
}

/**
 * Load branches for a project
 * @param {string} projectId
 */
export function loadBranches(projectId) {
    if (!projectId) return { main: null };
    try {
        const keys = getProjectKeys(projectId);
        const data = localStorage.getItem(keys.BRANCHES);
        return data ? JSON.parse(data) : { main: null };
    } catch (error) {
        console.error(`Failed to load branches for project ${projectId}:`, error);
        return { main: null };
    }
}

/**
 * Save current branch for a project
 * @param {string} projectId
 * @param {string} branchName 
 */
export function saveCurrentBranch(projectId, branchName) {
    if (!projectId) return false;
    try {
        const keys = getProjectKeys(projectId);
        localStorage.setItem(keys.CURRENT_BRANCH, branchName);
        return true;
    } catch (error) {
        console.error(`Failed to save current branch for project ${projectId}:`, error);
        return false;
    }
}

/**
 * Load current branch for a project
 * @param {string} projectId
 */
export function loadCurrentBranch(projectId) {
    if (!projectId) return 'main';
    try {
        const keys = getProjectKeys(projectId);
        const branch = localStorage.getItem(keys.CURRENT_BRANCH);
        return branch || 'main';
    } catch (error) {
        console.error(`Failed to load current branch for project ${projectId}:`, error);
        return 'main';
    }
}

/**
 * Delete a project and all its data
 * @param {string} projectId 
 */
export function deleteProjectData(projectId) {
    if (!projectId) return false;
    try {
        const keys = getProjectKeys(projectId);
        Object.values(keys).forEach(key => localStorage.removeItem(key));

        // Update project list
        const projects = loadProjects().filter(p => p.id !== projectId);
        saveProjects(projects);

        if (loadCurrentProjectId() === projectId) {
            localStorage.removeItem(GLOBAL_KEYS.CURRENT_PROJECT_ID);
        }
        return true;
    } catch (error) {
        console.error(`Failed to delete project ${projectId}:`, error);
        return false;
    }
}

/**
 * Clear all stored data (for reset functionality)
 */
export function clearAll() {
    try {
        localStorage.clear(); // Simple clear all for now
        return true;
    } catch (error) {
        console.error('Failed to clear storage:', error);
        return false;
    }
}

/**
 * Get storage info
 */
export function getStorageInfo() {
    try {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX)) {
                const value = localStorage.getItem(key);
                totalSize += key.length + value.length;
            }
        }
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
