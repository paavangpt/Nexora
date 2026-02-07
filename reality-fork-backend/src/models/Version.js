const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
    versionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    parentId: {
        type: String,
        default: null,
        index: true
    },
    mergeParentId: {
        type: String,
        default: null
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        default: 'User'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
versionSchema.index({ timestamp: -1 });
versionSchema.index({ parentId: 1 });

// Virtual for getting children versions
versionSchema.virtual('children', {
    ref: 'Version',
    localField: 'versionId',
    foreignField: 'parentId'
});

module.exports = mongoose.model('Version', versionSchema);
