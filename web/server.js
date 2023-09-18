const express = require("express");
const path = require("path");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
// const url_ = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());

// Serve React build
app.use(express.static(path.join(__dirname, "/dist")));

// Helper functions
const readFilez = (filePath) => {
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
  let htmlFiles = getHtmlFiles("../filings");

  if (!htmlFiles) {
    console.log("it grabbed no file");
  }
  htmlFiles = htmlFiles.filter((file, ii) => {
    const datePart = file.split("\\")[3].split("__")[0];
    const year = datePart.split("-")[0];
    if (ii == 2) {
      console.log("htmlFiles ", file);
      console.log("htmlFiles ", datePart);
      console.log("htmlFiles ", year);
    }
    return year == "2022";
  });
  const id = req.params.id;
  const filePath = htmlFiles[id];
  const content = readFilez(filePath);
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
    console.log("filtered_firm", filtered_firm);
    if (
      saved_date == filingDate &&
      saved_firm == filtered_firm &&
      saved_adsh == accessionNumber
    ) {
      return true;
    }
  });
  let filing_paths = fs.readFileSync("./file_names.txt", "utf8");
  filing_paths = filing_paths.split("\r\n");
  let filing_paths_return = [];
  filing_paths.forEach((path, i) => {
    // console.log("path", path);
    if (i == 2) {
      console.log("path", path.split("\\")[2].split("__")[0].slice(0, 4));
    }
    year = path.split("\\")[2].split("__")[0].slice(0, 4);
    if (i == 2) {
      console.log("2022 path", path);
    }

    if (year == "2022") {
      filing_paths_return.push(path);
    }
  });

  res.json({
    html: content,
    firm,
    filingDate,
    accessionNumber,
    filing_row,
    TOTAL_FILE_LENGTH: htmlFiles.length,
    filing_paths: filing_paths_return,
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
    return observation.includes(`\t${updatedData.adsh}\t${updatedData.firm}\t`);
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
