const express = require('express');
const router = express.Router();
const {
    getAllBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch,
    setActiveBranch,
    getActiveBranch
} = require('../controllers/branchController');

// Routes
router.get('/', getAllBranches);
router.post('/', createBranch);
router.get('/active', getActiveBranch);
router.get('/:name', getBranch);
router.put('/:name', updateBranch);
router.delete('/:name', deleteBranch);
router.put('/:name/activate', setActiveBranch);

module.exports = router;
