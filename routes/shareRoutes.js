// routes/shareRoutes.js
const express = require("express");
const router = express.Router();
const { generateShareLink, downloadSharedLink } = require("../controllers/shareController"); // Adjust the path if necessary

// Route to generate share link for a file/folder
router.post("/api/v1/user/share", generateShareLink);

// Route to download a shared file or folder
router.get("/api/v1/user/share/:shortId", downloadSharedLink);

module.exports = router;
