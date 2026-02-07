const Version = require('../models/Version');
const { getDiff, mergeVersions, findCommonAncestor, getAncestorChain } = require('../utils/versionControl');
const { v4: uuidv4 } = require('uuid');

// Get all versions
exports.getAllVersions = async (req, res, next) => {
    try {
        const versions = await Version.find()
            .sort({ timestamp: -1 })
            .lean();

        res.json({
            success: true,
            count: versions.length,
            data: versions
        });
    } catch (error) {
        next(error);
    }
};

// Get single version by ID
exports.getVersion = async (req, res, next) => {
    try {
        const { versionId } = req.params;
        const version = await Version.findOne({ versionId });

        if (!version) {
            return res.status(404).json({
                success: false,
                message: 'Version not found'
            });
        }

        res.json({
            success: true,
            data: version
        });
    } catch (error) {
        next(error);
    }
};

// Create new version (commit)
exports.createVersion = async (req, res, next) => {
    try {
        const { parentId, data, message, author } = req.body;

        // Validation
        if (!data || !message) {
            return res.status(400).json({
                success: false,
                message: 'Data and message are required'
            });
        }

        // Check if parent exists (if provided)
        if (parentId) {
            const parentExists = await Version.findOne({ versionId: parentId });
            if (!parentExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent version not found'
                });
            }
        }

        const version = await Version.create({
            versionId: uuidv4(),
            parentId: parentId || null,
            data,
            message,
            author: author || 'User',
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            data: version
        });
    } catch (error) {
        next(error);
    }
};

// Get diff between two versions
exports.getDiffBetweenVersions = async (req, res, next) => {
    try {
        const { versionId1, versionId2 } = req.params;

        const [version1, version2] = await Promise.all([
            Version.findOne({ versionId: versionId1 }),
            Version.findOne({ versionId: versionId2 })
        ]);

        if (!version1 || !version2) {
            return res.status(404).json({
                success: false,
                message: 'One or both versions not found'
            });
        }

        const diff = getDiff(version1, version2);

        res.json({
            success: true,
            data: {
                version1: { versionId: version1.versionId, message: version1.message },
                version2: { versionId: version2.versionId, message: version2.message },
                diff
            }
        });
    } catch (error) {
        next(error);
    }
};

// Merge two versions
exports.mergeVersions = async (req, res, next) => {
    try {
        const { sourceVersionId, targetVersionId, resolvedData, message, author } = req.body;

        const [sourceVersion, targetVersion] = await Promise.all([
            Version.findOne({ versionId: sourceVersionId }),
            Version.findOne({ versionId: targetVersionId })
        ]);

        if (!sourceVersion || !targetVersion) {
            return res.status(404).json({
                success: false,
                message: 'Source or target version not found'
            });
        }

        // Find common ancestor
        const baseVersion = await findCommonAncestor(sourceVersionId, targetVersionId, Version);

        if (!baseVersion) {
            // No common ancestor - treat as if merging from empty
            const emptyVersion = { data: {} };
            const result = mergeVersions(emptyVersion, sourceVersion, targetVersion);

            if (!result.success && !resolvedData) {
                return res.status(409).json({
                    success: false,
                    message: 'Merge conflicts detected',
                    conflicts: result.conflicts
                });
            }
        }

        // Perform merge
        let mergeResult;

        if (resolvedData) {
            // User has already resolved conflicts
            mergeResult = {
                success: true,
                mergedData: resolvedData,
                conflicts: []
            };
        } else {
            // Auto-merge, may have conflicts
            mergeResult = mergeVersions(baseVersion || { data: {} }, sourceVersion, targetVersion);
        }

        if (!mergeResult.success) {
            return res.status(409).json({
                success: false,
                message: 'Merge conflicts detected',
                conflicts: mergeResult.conflicts
            });
        }

        // Create merge commit
        const mergeVersion = await Version.create({
            versionId: uuidv4(),
            parentId: targetVersionId,
            mergeParentId: sourceVersionId,
            data: mergeResult.mergedData,
            message: message || `Merge into ${targetVersion.message}`,
            author: author || 'User',
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            data: mergeVersion
        });
    } catch (error) {
        next(error);
    }
};

// Get version history chain
exports.getVersionChain = async (req, res, next) => {
    try {
        const { versionId } = req.params;

        const chain = await getAncestorChain(versionId, Version);

        res.json({
            success: true,
            count: chain.length,
            data: chain
        });
    } catch (error) {
        next(error);
    }
};

// Delete version
exports.deleteVersion = async (req, res, next) => {
    try {
        const { versionId } = req.params;
        const version = await Version.findOneAndDelete({ versionId });

        if (!version) {
            return res.status(404).json({
                success: false,
                message: 'Version not found'
            });
        }

        res.json({
            success: true,
            message: 'Version deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
