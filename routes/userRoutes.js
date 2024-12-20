const express = require("express");
const {
  createUser,
  validateUser,
  loginUser,
  unregisterUser,
} = require("../controllers/userController");
const router = express.Router();

// Routes
router.post("/create", createUser); 
router.post("/validate", validateUser); 
router.post("/login", loginUser); 
router.post("/unregister", unregisterUser); 

module.exports = router;
