/**
 * Compare two versions and return their differences
 */
function getDiff(version1, version2) {
    const diff = {
        added: {},
        removed: {},
        modified: {},
        unchanged: {}
    };

    const allKeys = new Set([
        ...Object.keys(version1.data || {}),
        ...Object.keys(version2.data || {})
    ]);

    allKeys.forEach(key => {
        const val1 = version1.data?.[key];
        const val2 = version2.data?.[key];

        if (val1 === undefined && val2 !== undefined) {
            diff.added[key] = val2;
        } else if (val1 !== undefined && val2 === undefined) {
            diff.removed[key] = val1;
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            diff.modified[key] = { before: val1, after: val2 };
        } else {
            diff.unchanged[key] = val1;
        }
    });

    return diff;
}

/**
 * Perform a three-way merge of two versions with a common base
 */
function mergeVersions(baseVersion, version1, version2) {
    const result = {
        success: true,
        mergedData: {},
        conflicts: []
    };

    const allKeys = new Set([
        ...Object.keys(baseVersion.data || {}),
        ...Object.keys(version1.data || {}),
        ...Object.keys(version2.data || {})
    ]);

    allKeys.forEach(key => {
        const baseVal = baseVersion.data?.[key];
        const val1 = version1.data?.[key];
        const val2 = version2.data?.[key];

        const changed1 = JSON.stringify(val1) !== JSON.stringify(baseVal);
        const changed2 = JSON.stringify(val2) !== JSON.stringify(baseVal);

        if (!changed1 && !changed2) {
            // Neither changed
            if (baseVal !== undefined) {
                result.mergedData[key] = baseVal;
            }
        } else if (changed1 && !changed2) {
            // Only version1 changed
            if (val1 !== undefined) {
                result.mergedData[key] = val1;
            }
        } else if (!changed1 && changed2) {
            // Only version2 changed
            if (val2 !== undefined) {
                result.mergedData[key] = val2;
            }
        } else if (JSON.stringify(val1) === JSON.stringify(val2)) {
            // Both changed to same value
            if (val1 !== undefined) {
                result.mergedData[key] = val1;
            }
        } else {
            // Conflict: both changed to different values
            result.conflicts.push({ key, value1: val1, value2: val2 });
            result.success = false;
        }
    });

    return result;
}

/**
 * Find common ancestor of two versions
 */
async function findCommonAncestor(versionId1, versionId2, Version) {
    const ancestors1 = await getAncestorChain(versionId1, Version);
    const ancestors2 = await getAncestorChain(versionId2, Version);

    // Find first common version
    for (const v1 of ancestors1) {
        if (ancestors2.some(v2 => v2.versionId === v1.versionId)) {
            return v1;
        }
    }

    return null;
}

/**
 * Get ancestor chain from a version back to root
 */
async function getAncestorChain(versionId, Version) {
    const chain = [];
    let currentId = versionId;

    while (currentId) {
        const version = await Version.findOne({ versionId: currentId });
        if (!version) break;
        chain.push(version);
        currentId = version.parentId;
    }

    return chain;
}

module.exports = {
    getDiff,
    mergeVersions,
    findCommonAncestor,
    getAncestorChain
};
