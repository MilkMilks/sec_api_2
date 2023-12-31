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
// Error: ENOENT: no such file or directory, open './OBSERVATIONS.TSV'
// Helper functions

// Check if the file exists
if (!fs.existsSync("./OBSERVATIONS.TSV")) {
  // If the file does not exist, create it
  fs.writeFileSync("./OBSERVATIONS.TSV", "");
  //now lets write the header row: DATE	ADSH	FIRM	SOURCE	BLACK	MALE	FEMALE	LGBT	NONBINARY	ASIAN	LATINX	NO_ANSWER	DIRECTORS	NOTES
  fs.appendFileSync(
    "./OBSERVATIONS.TSV",
    "DATE\tADSH\tFIRM\tSOURCE\tBLACK\tMALE\tFEMALE\tLGBT\tNONBINARY\tASIAN\tLATINX\tNO_ANSWER\tDIRECTORS\tNOTES\n"
  );
}
const readFilez = (filePath) => {
  return fs.readFileSync(filePath, "utf8");
};

const getHtmlFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  // console.log("files", files);
  arrayOfFiles = arrayOfFiles || [];

  files &&
    files.forEach((file) => {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getHtmlFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        if (file.endsWith(".htm")) {
          arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      }
    });
  // console.log("arrayOfFiles", arrayOfFiles);
  return arrayOfFiles;
};

// Return HTML file
app.get("/get-html-file/:id", (req, res) => {
  let htmlFiles = getHtmlFiles("../filings");

  if (!htmlFiles) {
    console.log("it grabbed no file");
  }

  const id = req.params.id;
  const filePath = htmlFiles[id];
  const content = readFilez(filePath);
  const pathParts = filePath.split("\\");
  console.log("pathParts", pathParts);
  const firm = `${pathParts[2]}`;
  console.log("FIRM", firm);
  const nasdaq_rows = fs.readFileSync("./sec_tickers_ciks.json", "utf8");
  // Parse the JSON data
  const secTickers = JSON.parse(nasdaq_rows);
  for (const entry of Object.values(secTickers)) {
    entry.ticker = entry.ticker.toLowerCase();
  }

  const temp_nasdaq_row = Object.values(secTickers).find(
    (entry) => entry.ticker === firm
  );
  console.log("temp_nasdaq_row", temp_nasdaq_row);
  const nasdaq_csv = `${temp_nasdaq_row.cik_str},${temp_nasdaq_row.ticker}`;
  let nasdaq_row = nasdaq_csv.split(",");

  let urls = fs.readFileSync("./urls_final.txt", "utf8").split("\n");
  console.log("urlsss", urls[0].split("/")[6]);
  console.log("nasdaq_row", nasdaq_row);
  let url = urls.filter((url) => url.split("/")[6] == nasdaq_row[0])[0];
  console.log("url", url);
  const accessionNumber = url.split("/")[7];
  console.log("accessionNumber", accessionNumber);
  // console.log("accessionNumber", accessionNumber);
  let tsv = fs.readFileSync("./OBSERVATIONS.TSV", "utf8");
  //split into array of lines
  tsv = tsv.split("\n");

  //find the line that starts with the firm, filingDate, accessionNumber,
  const filing_row = tsv.filter((line, i) => {
    if (i == 0) return false;
    const row = line.split("\t");

    // DATE	ADSH	FIRM  SOURCE	BLACK	MALE	FEMALE	LGBT	NON_BINARY	NO_ANSWER	DIRECTORS	NOTES
    const saved_adsh = row[1];
    let filtered_firm = firm;
    console.log("filtered_firm", filtered_firm);
    if (saved_adsh == accessionNumber) {
      return true;
    }
  });
  // https://www.sec.gov/Archives/edgar/data/1576873/000149315222027313/formdef14a.htm split this part off for filing
  const parts = url.split("/");

  // Remove the last part
  parts.pop();

  // Join the remaining parts to get the base URL
  const filing_url = parts.join("/");
  res.json({
    html: content,
    firm,
    filingDate: "2022",
    accessionNumber,
    filing_row,
    cik: nasdaq_row[1],
    filing_url,
    htmlFiles,
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
