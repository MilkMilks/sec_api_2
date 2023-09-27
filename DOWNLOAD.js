const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Custom headers with your real email address
const customHeaders = {
  "User-Agent": "Personal evan.p.firth@gmail.com",
  "Accept-Encoding": "gzip, deflate",
  Host: "www.sec.gov",
};

// Function to create a directory if it doesn't exist
function createDirectoryIfNotExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

// Function to fetch and save a filing with a 120ms delay
async function fetchAndSaveFilingWithDelay(url) {
  try {
    // Create the ./filings directory if it doesn't exist
    createDirectoryIfNotExists("./filings");
    //desired op name:
    //./filings/ticker/2023-03-16__000119312523072587.html
    // Extract the CIK, ADSH, and ticker from the URL
    // https://www.sec.gov/Archives/edgar/data/1445283/000114036122015716/ny20002733x1_def14a.htm/2022-04-25___ka
    const cik = url.split("/")[6];
    const adsh = url.split("/")[7];
    const fileName = url.split("/")[8];
    const date = url.split("/")[9].split("___")[0];
    const ticker = url.split("/")[9].split("___")[1];

    // Create a subdirectory with the CIK as the name
    const subdirectoryPath = `./filings/${ticker}/`;
    createDirectoryIfNotExists(subdirectoryPath);

    // Create the filename with CIK, ADSH, and the original file name
    const newFileName = `${date}__${adsh}.htm`;
    const desiredUrl = url.split("/").slice(0, -1).join("/");

    // Fetch the filing with custom headers
    const response = await axios.get(desiredUrl, {
      headers: customHeaders,
      responseType: "stream",
    });

    // Create a writable stream to save the file
    const filePath = path.join(subdirectoryPath, newFileName);
    const writer = fs.createWriteStream(filePath);

    // Pipe the response data into the file
    response.data.pipe(writer);

    // Wait for the file to finish writing
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`Downloaded ${desiredUrl} to ${filePath}`);

    // Wait for 120ms before making the next request
    await new Promise((resolve) => setTimeout(resolve, 120));
  } catch (error) {
    console.error(`Error downloading ${url}: ${error.message}`);
  }
}

// Read URLs from urls.txt and download filings with delay
async function main() {
  try {
    const data = fs.readFileSync("urls_fetched_final2_.txt", "utf-8");
    const lines = data.split("\n");

    for (const url of lines) {
      await fetchAndSaveFilingWithDelay(url);
    }
  } catch (error) {
    console.error(`Error reading urls.txt: ${error.message}`);
  }
}

// Start the main process
main();
