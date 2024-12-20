const fs = require("fs-extra");
const path = require("path");
const { fork } = require("child_process"); // Fork for compression
const archiver = require("archiver");
const zlib = require("zlib");

const STORAGE_PATH = process.env.STORAGE_PATH || "./storage/users";
const LINK_EXPIRATION_TIME = parseInt(process.env.LINK_EXPIRATION_TIME) * 60000; // Convert minutes to ms

const sharedLinks = {};

// Generates random ID
const generateShortId = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

const getUserFilePath = (username, fileName) =>
  path.join(STORAGE_PATH, `user_${username}_folders.json`);

const checkFileOrFolderExists = (folderStructure, targetPath) => {
  const parts = targetPath.split("/");
  let current = folderStructure.root;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current[part]) {
      return false;
    }
    current = current[part];
  }
  return true;
};

exports.generateShareLink = async (req, res) => {
  const { username, path: targetPath } = req.body;

  if (!targetPath || !username) {
    return res.status(400).json({ message: "Username and path are required" });
  }

  const folderFilePath = getUserFilePath(
    username,
    "user_tsotne22_folders.json"
  );

  if (!fs.existsSync(folderFilePath)) {
    return res.status(404).json({ message: "User folder structure not found" });
  }

  const folderStructure = await fs.readJson(folderFilePath);

  if (!checkFileOrFolderExists(folderStructure, targetPath)) {
    return res.status(404).json({ message: "File or folder not found" });
  }

  const shortId = generateShortId();

  sharedLinks[shortId] = {
    targetPath: targetPath,
    username: username,
    expiration: Date.now() + LINK_EXPIRATION_TIME,
  };

  res.status(200).json({
    message: "Link generated successfully",
    shareLink: `http://localhost:3000/api/v1/user/share/${shortId}`,
  });

  const targetPathFile = getUserFilePath(username, targetPath);

  if (fs.lstatSync(targetPathFile).isDirectory()) {
    const child = fork(path.join(__dirname, "../utils/compressFile.js"), [
      targetPathFile,
    ]);

    child.on("message", (message) => {
      console.log("Compression complete:", message);
    });

    child.on("error", (error) => {
      console.error("Error with child process:", error);
    });
  }
};

exports.downloadSharedLink = (req, res) => {
  const { shortId } = req.params;

  const sharedLink = sharedLinks[shortId];

  if (!sharedLink) {
    return res.status(404).json({ message: "Invalid or expired link" });
  }

  if (Date.now() > sharedLink.expiration) {
    delete sharedLinks[shortId];
    return res.status(400).json({ message: "Link has expired" });
  }

  const { username, targetPath } = sharedLink;
  const targetPathFile = path.join(STORAGE_PATH, username, targetPath);

  if (fs.lstatSync(targetPathFile).isDirectory()) {
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    res.attachment(`${targetPath}.zip`);
    archive.pipe(res);

    archive.directory(targetPathFile, false);
    archive.finalize();
  } else {
    const fileStream = fs.createReadStream(targetPathFile);
    const zipStream = fileStream.pipe(zlib.createGzip());

    res.attachment(targetPath);
    zipStream.pipe(res);
  }

  delete sharedLinks[shortId];
};
