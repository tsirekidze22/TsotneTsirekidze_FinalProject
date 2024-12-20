const fs = require("fs-extra");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Constants
const STORAGE_PATH = process.env.STORAGE_PATH || "./storage/users";
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

fs.ensureDirSync(STORAGE_PATH);

const getUserFilePath = (username, fileName) =>
    path.join(STORAGE_PATH, `user_${username}_folders.json`);

const getUserFolderPath = (username) =>
    path.join(STORAGE_PATH, username);

// Create User
exports.createUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const userFilePath = getUserFilePath(username);

  // Check if user already exists
  if (fs.existsSync(userFilePath)) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user profile
  const userProfile = { username, password: hashedPassword };
  await fs.writeJson(userFilePath, userProfile);

  res.status(201).json({ message: "User created successfully" });
};

// Validate User
exports.validateUser = (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  const userFilePath = getUserFilePath(username);

  if (fs.existsSync(userFilePath)) {
    return res.status(200).json({ valid: true });
  } else {
    return res.status(404).json({ valid: false });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const userFilePath = getUserFilePath(username);

  if (!fs.existsSync(userFilePath)) {
    return res.status(404).json({ message: "User not found" });
  }

  // Load user profile
  const userProfile = await fs.readJson(userFilePath);

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, userProfile.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  res.status(200).json({ message: "Login successful", token });
};

exports.unregisterUser = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  const userFilePath = getUserFilePath(username);
  const userFolderPath = getUserFolderPath(username);

  // Checks if user exists
  if (!fs.existsSync(userFilePath)) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    // Remove the user's folder structure file (metadata)
    await fs.remove(userFilePath);
    console.log(`User's folder structure file deleted: ${userFilePath}`);

    // Remove the user's folder and all files inside it
    if (fs.existsSync(userFolderPath)) {
      await fs.remove(userFolderPath); 
      console.log(`User's files and folder deleted: ${userFolderPath}`);
    }

    // Respond with success
    res.status(200).json({ message: "User and associated data deleted successfully" });
  } catch (error) {
    console.error("Error during user data deletion:", error);
    res.status(500).json({ message: "Failed to delete user data" });
  }
};
