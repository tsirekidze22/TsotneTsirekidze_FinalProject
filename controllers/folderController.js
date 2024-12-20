const fs = require("fs-extra");
const path = require("path");

const getUserFolderFilePath = (username) =>
  path.join(process.env.STORAGE_PATH, `user_${username}_folders.json`);

const loadFolderStructure = async (username) => {
  const folderFilePath = getUserFolderFilePath(username);

  if (!fs.existsSync(folderFilePath)) {
    const defaultStructure = { root: {} };
    await fs.writeJson(folderFilePath, defaultStructure);
    return defaultStructure;
  }

  return await fs.readJson(folderFilePath);
};

const saveFolderStructure = async (username, folderStructure) => {
  const folderFilePath = getUserFolderFilePath(username);
  await fs.writeJson(folderFilePath, folderStructure);
};

exports.getUserSpace = async (req, res) => {
  try {
    const username = req.user.username;
    const folderStructure = await loadFolderStructure(username);
    res.status(200).json({ folders: folderStructure });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving folder structure",
      error: err.message,
    });
  }
};

exports.createFolderOrFile = async (req, res) => {
  try {
    const { path: targetPath, type } = req.body;
    const username = req.user.username;

    if (!targetPath || !type) {
      return res.status(400).json({ message: "Path and type are required" });
    }

    const folderStructure = await loadFolderStructure(username);

    const parts = targetPath.split("/");
    let current = folderStructure.root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {}; // Create missing folder
      }
      current = current[part];
    }

    const target = parts[parts.length - 1];
    if (type === "folder") {
      current[target] = {};
    } else if (type === "file") {
      current[target] = "file";
    }

    await saveFolderStructure(username, folderStructure);
    res.status(201).json({ message: `${type} created successfully` });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating folder or file", error: err.message });
  }
};

exports.deleteFileOrFolder = async (req, res) => {
  try {
    const { path: targetPath } = req.body;
    const username = req.user.username;

    if (!targetPath) {
      return res.status(400).json({ message: "Path is required" });
    }

    const folderStructure = await loadFolderStructure(username);

    const parts = targetPath.split("/");
    let current = folderStructure.root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        return res.status(404).json({ message: "Invalid path" });
      }
      current = current[part];
    }

    const target = parts[parts.length - 1];
    if (
      current[target] &&
      typeof current[target] === "object" &&
      Object.keys(current[target]).length > 0
    ) {
      return res
        .status(400)
        .json({ message: "Only empty folders can be deleted" });
    }

    delete current[target];
    await saveFolderStructure(username, folderStructure);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting folder or file", error: err.message });
  }
};
