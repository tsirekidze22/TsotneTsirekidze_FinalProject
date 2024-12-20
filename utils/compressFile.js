const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const filePath = process.argv[2]; // File or folder path passed as an argument
const outputPath = path.join(
  path.dirname(filePath),
  `${path.basename(filePath)}.zip`
); // Path for the output zip file

const output = fs.createWriteStream(outputPath);
const archive = archiver("zip", {
  zlib: { level: 9 }, // Compression level
});

// Listen for errors during compression
archive.on("error", (err) => {
  console.error("Error compressing file:", err);
  process.exit(1);
});

// When the compression is done
archive.on("finish", () => {
  console.log(`File or folder compressed to ${outputPath}`);
});

// Pipe the archive output to the file stream
archive.pipe(output);

// Check if the input path is a directory or file
fs.lstat(filePath, (err, stats) => {
  if (err) {
    console.error("Error reading the file or directory:", err);
    process.exit(1);
  }

  if (stats.isDirectory()) {
    // If it's a directory, zip the entire directory
    archive.directory(filePath, path.basename(filePath));
  } else {
    // If it's a file, zip the single file
    archive.file(filePath, { name: path.basename(filePath) });
  }

  // Finalize the archive to start the compression
  archive.finalize();
});
