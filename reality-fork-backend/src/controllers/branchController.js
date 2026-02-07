const Branch = require('../models/Branch');
const Version = require('../models/Version');

// Get all branches
exports.getAllBranches = async (req, res, next) => {
    try {
        const branches = await Branch.find().sort({ name: 1 });

        res.json({
            success: true,
            count: branches.length,
            data: branches
        });
    } catch (error) {
        next(error);
    }
};

// Get single branch
exports.getBranch = async (req, res, next) => {
    try {
        const { name } = req.params;
        const branch = await Branch.findOne({ name });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Get version this branch points to
        const version = await Version.findOne({ versionId: branch.versionId });

        res.json({
            success: true,
            data: {
                ...branch.toObject(),
                version
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create new branch
exports.createBranch = async (req, res, next) => {
    try {
        const { name, versionId } = req.body;

        // Validation
        if (!name || !versionId) {
            return res.status(400).json({
                success: false,
                message: 'Branch name and version ID are required'
            });
        }

        // Check if version exists
        const versionExists = await Version.findOne({ versionId });
        if (!versionExists) {
            return res.status(404).json({
                success: false,
                message: 'Version not found'
            });
        }

        // Check if branch name already exists
        const branchExists = await Branch.findOne({ name });
        if (branchExists) {
            return res.status(409).json({
                success: false,
                message: 'Branch with this name already exists'
            });
        }

        const branch = await Branch.create({
            name,
            versionId,
            isActive: false
        });

        res.status(201).json({
            success: true,
            data: branch
        });
    } catch (error) {
        next(error);
    }
};

// Update branch (move pointer to different version)
exports.updateBranch = async (req, res, next) => {
    try {
        const { name } = req.params;
        const { versionId } = req.body;

        // Check if version exists
        const versionExists = await Version.findOne({ versionId });
        if (!versionExists) {
            return res.status(404).json({
                success: false,
                message: 'Version not found'
            });
        }

        const branch = await Branch.findOneAndUpdate(
            { name },
            { versionId, updatedAt: new Date() },
            { new: true }
        );

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        res.json({
            success: true,
            data: branch
        });
    } catch (error) {
        next(error);
    }
};

// Set active branch
exports.setActiveBranch = async (req, res, next) => {
    try {
        const { name } = req.params;

        // Deactivate all branches
        await Branch.updateMany({}, { isActive: false });

        // Activate specified branch
        const branch = await Branch.findOneAndUpdate(
            { name },
            { isActive: true },
            { new: true }
        );

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        res.json({
            success: true,
            data: branch
        });
    } catch (error) {
        next(error);
    }
};

// Delete branch
exports.deleteBranch = async (req, res, next) => {
    try {
        const { name } = req.params;

        // Prevent deleting main branch
        if (name === 'main') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete main branch'
            });
        }

        const branch = await Branch.findOneAndDelete({ name });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        res.json({
            success: true,
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get active branch
exports.getActiveBranch = async (req, res, next) => {
    try {
        const branch = await Branch.findOne({ isActive: true });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'No active branch found'
            });
        }

        const version = await Version.findOne({ versionId: branch.versionId });

        res.json({
            success: true,
            data: {
                ...branch.toObject(),
                version
            }
        });
    } catch (error) {
        next(error);
    }
};
