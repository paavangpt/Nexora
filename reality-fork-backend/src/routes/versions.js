const express = require('express');
const router = express.Router();
const {
    getAllVersions,
    getVersion,
    createVersion,
    getDiffBetweenVersions,
    mergeVersions,
    getVersionChain,
    deleteVersion
} = require('../controllers/versionController');

// Routes
router.get('/', getAllVersions);
router.post('/', createVersion);
router.post('/merge', mergeVersions);
router.get('/diff/:versionId1/:versionId2', getDiffBetweenVersions);
router.get('/:versionId', getVersion);
router.delete('/:versionId', deleteVersion);
router.get('/:versionId/chain', getVersionChain);

module.exports = router;
