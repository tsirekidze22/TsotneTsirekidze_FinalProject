const express = require('express');
const {
    getUserSpace,
    createFolderOrFile,
    deleteFileOrFolder
} = require('../controllers/folderController');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware'); // Middleware to check JWT

// Folder Management Routes
router.get('/space', authenticateToken, getUserSpace);
router.put('/space/create', authenticateToken, createFolderOrFile);
router.delete('/space/file', authenticateToken, deleteFileOrFolder);

module.exports = router;
