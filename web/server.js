const express = require("express");
const path = require("path");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());

// Serve React build
app.use(express.static(path.join(__dirname, "/dist")));
console.log("__dirname:", __dirname);

// Helper functions
const readFile = (filePath) => {
  return fs.readFileSync(filePath, "utf8");
};

const getHtmlFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  // console.log("files:", files);
  arrayOfFiles = arrayOfFiles || [];

  files &&
    files.forEach((file) => {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getHtmlFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        if (file.endsWith(".html")) {
          arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      }
    });
  return arrayOfFiles;
};

// API routes

// Return HTML file
app.get("/get-html-file/:id", (req, res) => {
  const htmlFiles = getHtmlFiles("../filings");

  const { id } = req.params;
  console.log("id:", id);

  const filePath = htmlFiles[id];

  const content = readFile(filePath);
  console.log("filePath:", filePath);

  const pathParts = filePath.split("\\");

  const firm =
    pathParts[2] +
    " " +
    pathParts[3].split("__")[1].split(".")[0].substring(0, 10);
  console.log("firm:", firm);

  const filingDate = pathParts[3].split("__")[0];
  console.log("filingDate:", filingDate);

  const accessionNumber = pathParts[3].split("__")[1].split(".")[0];
  console.log("accessionNumber:", accessionNumber);

  res.json({
    html: content,
    firm,
    filingDate,
    accessionNumber,
  });
});

// Serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/dist/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
