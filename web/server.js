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

// Helper functions
const readFile = (filePath) => {
  return fs.readFileSync(filePath, "utf8");
};

const getHtmlFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
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

// Return HTML file
app.get("/get-html-file/:id", (req, res) => {
  const htmlFiles = getHtmlFiles("../filings");
  if (!htmlFiles) {
    console.log("it grabbed no file");
  }
  const id = req.params.id;
  const filePath = htmlFiles[id];

  const content = readFile(filePath);
  const pathParts = filePath.split("\\");
  const firm = `${pathParts[2]} ${pathParts[3]
    .split("__")[1]
    .split(".")[0]
    .substring(0, 10)}`;
  const filingDate = pathParts[3].split("__")[0];
  const accessionNumber = pathParts[3].split("__")[1].split(".")[0];

  let tsv = fs.readFileSync("./OBSERVATIONS.TSV", "utf8");
  //split into array of lines
  tsv = tsv.split("\n");

  //find the line that starts with the firm, filingDate, accessionNumber,
  const filing_row = tsv.filter((line, i) => {
    if (i == 0) return false;
    const row = line.split("\t");

    // DATE	ADSH	FIRM  SOURCE	BLACK	MALE	FEMALE	LGBT	NON_BINARY	NO_ANSWER	DIRECTORS	NOTES
    const [saved_date, saved_adsh, saved_firm] = row;
    let filtered_firm = firm.split(" ")[0];
    if (
      saved_date == filingDate &&
      saved_firm == filtered_firm &&
      saved_adsh == accessionNumber
    ) {
      return true;
    }
  });

  res.json({
    html: content,
    firm,
    filingDate,
    accessionNumber,
    filing_row,
    TOTAL_FILE_LENGTH: htmlFiles.length,
  });
});

// Serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/dist/index.html"));
});

app.post("/update-observations", (req, res) => {
  // Get updated data from request
  const updatedData = req.body;
  console.log(updatedData);
  // Validate data
  if (!updatedData.date) {
    return res.status(400).send("Invalid data");
  }

  // Read observations from TSV file
  const observations = fs
    .readFileSync("./OBSERVATIONS.TSV", "utf8")
    .split("\n");

  // Find index of observation to update
  const row = observations.findIndex((observation) => {
    return observation.includes(`\t${updatedData.adsh}\t`);
  });

  if (row === -1) {
    // Append new row
    observations.push(Object.values(updatedData).join("\t"));
  } else {
    // Update existing row
    observations[row] = Object.values(updatedData).join("\t");
  }

  // Write updated observations back to file
  fs.writeFileSync("observations.tsv", observations.join("\n"));

  res.send("Observation updated successfully");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
