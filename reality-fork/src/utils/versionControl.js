import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new version object
 * @param {Object} currentData - The current JSON data to version
 * @param {string|null} parentId - ID of the parent version
 * @param {string} message - Commit message
 * @param {string} author - Author name
 * @param {string|null} mergeParentId - ID of second parent for merge commits
 * @returns {Object} New version object
 */
export function createVersion(currentData, parentId, message, author = 'User', mergeParentId = null) {
    return {
        id: uuidv4(),
        parentId: parentId,
        data: JSON.parse(JSON.stringify(currentData)), // Deep clone
        timestamp: new Date().toISOString(),
        message: message,
        author: author,
        mergeParentId: mergeParentId,
    };
}

/**
 * Compare two versions and return their differences
 * @param {Object} version1 - First version object
 * @param {Object} version2 - Second version object
 * @returns {Object} Diff object with added, removed, modified, unchanged fields
 */
export function getDiff(version1, version2) {
    const data1 = version1?.data || {};
    const data2 = version2?.data || {};

    const keys1 = new Set(Object.keys(data1));
    const keys2 = new Set(Object.keys(data2));

    const added = {};
    const removed = {};
    const modified = {};
    const unchanged = {};

    // Find added keys (in version2 but not version1)
    keys2.forEach(key => {
        if (!keys1.has(key)) {
            added[key] = data2[key];
        }
    });

    // Find removed keys (in version1 but not version2)
    keys1.forEach(key => {
        if (!keys2.has(key)) {
            removed[key] = data1[key];
        }
    });

    // Find modified and unchanged keys
    keys1.forEach(key => {
        if (keys2.has(key)) {
            const val1 = JSON.stringify(data1[key]);
            const val2 = JSON.stringify(data2[key]);

            if (val1 !== val2) {
                modified[key] = {
                    before: data1[key],
                    after: data2[key],
                };
            } else {
                unchanged[key] = data1[key];
            }
        }
    });

    return { added, removed, modified, unchanged };
}

/**
 * Perform a three-way merge of two versions with a common base
 * @param {Object} baseVersion - Common ancestor version
 * @param {Object} version1 - First version to merge
 * @param {Object} version2 - Second version to merge
 * @returns {Object} Merge result with success flag, merged data, and conflicts
 */
export function mergeVersions(baseVersion, version1, version2) {
    const baseData = baseVersion?.data || {};
    const data1 = version1?.data || {};
    const data2 = version2?.data || {};

    const mergedData = { ...baseData };
    const conflicts = [];

    // Get all unique keys from all three versions
    const allKeys = new Set([
        ...Object.keys(baseData),
        ...Object.keys(data1),
        ...Object.keys(data2),
    ]);

    allKeys.forEach(key => {
        const baseVal = JSON.stringify(baseData[key]);
        const val1 = JSON.stringify(data1[key]);
        const val2 = JSON.stringify(data2[key]);

        const inBase = key in baseData;
        const in1 = key in data1;
        const in2 = key in data2;

        // Case 1: Key unchanged in both - keep as is
        if (val1 === baseVal && val2 === baseVal) {
            if (inBase) {
                mergedData[key] = baseData[key];
            }
            return;
        }

        // Case 2: Only version1 changed the key
        if (val1 !== baseVal && val2 === baseVal) {
            if (in1) {
                mergedData[key] = data1[key];
            } else {
                delete mergedData[key];
            }
            return;
        }

        // Case 3: Only version2 changed the key
        if (val1 === baseVal && val2 !== baseVal) {
            if (in2) {
                mergedData[key] = data2[key];
            } else {
                delete mergedData[key];
            }
            return;
        }

        // Case 4: Both changed the key
        if (val1 !== baseVal && val2 !== baseVal) {
            // If both changed to the same value, it's not a conflict
            if (val1 === val2) {
                if (in1) {
                    mergedData[key] = data1[key];
                } else {
                    delete mergedData[key];
                }
                return;
            }

            // Conflict: both changed differently
            conflicts.push({
                key: key,
                baseValue: baseData[key],
                value1: data1[key],
                value2: data2[key],
            });
            return;
        }

        // Case 5: Key added in both (wasn't in base)
        if (!inBase && in1 && in2) {
            if (val1 === val2) {
                mergedData[key] = data1[key];
            } else {
                conflicts.push({
                    key: key,
                    baseValue: undefined,
                    value1: data1[key],
                    value2: data2[key],
                });
            }
            return;
        }

        // Case 6: Key added in only one
        if (!inBase && in1 && !in2) {
            mergedData[key] = data1[key];
            return;
        }
        if (!inBase && !in1 && in2) {
            mergedData[key] = data2[key];
            return;
        }
    });

    // Remove conflicting keys from merged data (user must resolve)
    conflicts.forEach(conflict => {
        delete mergedData[conflict.key];
    });

    return {
        success: conflicts.length === 0,
        mergedData,
        conflicts,
    };
}

/**
 * Find the common ancestor of two versions
 * @param {Object} version1 - First version
 * @param {Object} version2 - Second version
 * @param {Array} allVersions - Array of all versions
 * @returns {Object|null} Common ancestor version or null
 */
export function findCommonAncestor(version1, version2, allVersions) {
    if (!version1 || !version2 || !allVersions?.length) {
        return null;
    }

    // Build set of ancestors for version1
    const ancestors1 = new Set();
    let current = version1;

    while (current) {
        ancestors1.add(current.id);
        if (current.parentId) {
            current = allVersions.find(v => v.id === current.parentId);
        } else {
            break;
        }
    }

    // Walk up version2's ancestry to find first common ancestor
    current = version2;
    while (current) {
        if (ancestors1.has(current.id)) {
            return current;
        }
        if (current.parentId) {
            current = allVersions.find(v => v.id === current.parentId);
        } else {
            break;
        }
    }

    return null;
}

/**
 * Get the version chain from root to specified version
 * @param {string} versionId - Target version ID
 * @param {Array} allVersions - Array of all versions
 * @returns {Array} Array of versions from root to target
 */
export function getVersionChain(versionId, allVersions) {
    if (!versionId || !allVersions?.length) {
        return [];
    }

    const chain = [];
    let current = allVersions.find(v => v.id === versionId);

    while (current) {
        chain.unshift(current); // Add to beginning
        if (current.parentId) {
            current = allVersions.find(v => v.id === current.parentId);
        } else {
            break;
        }
    }

    return chain;
}

/**
 * Get versions that belong to a specific branch
 * @param {string} branchVersionId - The head version ID of the branch
 * @param {Array} allVersions - Array of all versions
 * @returns {Array} Array of versions in this branch
 */
export function getBranchVersions(branchVersionId, allVersions) {
    return getVersionChain(branchVersionId, allVersions);
}

/**
 * Check if data has changed from a version
 * @param {Object} currentData - Current data
 * @param {Object} version - Version to compare against
 * @returns {boolean} True if data has changed
 */
export function hasChanges(currentData, version) {
    if (!version) return Object.keys(currentData || {}).length > 0;

    const current = JSON.stringify(currentData);
    const versioned = JSON.stringify(version.data);

    return current !== versioned;
}
