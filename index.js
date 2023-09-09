const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");
const logger = require("winston");
const commander = require("commander");

// Read firms file
const firms = [];

async function readFirms() {
  const data = fs.readFileSync("./nasdaq_firms.tsv", "utf8");

  data.split("\n").forEach((line) => {
    let [cik, ticker] = line.trim().split("\t");
    ticker = ticker.toLowerCase();
    firms.push({
      cik,
      ticker,
    });
  });
}

// Get filings metadata

// Get filings metadata
async function getAllFilings(cik_or_ticker, searchForm, startDate, endDate) {
  try {
    cik_or_ticker = cik_or_ticker[0];
    console.log("cik_or_ticker", cik_or_ticker);
    const cik = cik_or_ticker.cik;
    const ticker = cik_or_ticker.ticker;
    const cikPadded = cik.padStart(10, "0");
    const url = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;

    const response = await axios.get(url);
    // make API request
    const submissions = response.data;
    const filingUrls = submissions.filings.recent;
    // console.log("filingUrls", filingUrls);
    const {
      accessionNumber: accessionNumbers,
      filingDate: filingDates,
      primaryDocument: primaryDocuments,
      form: filingForms,
    } = filingUrls;

    const urls = [];

    for (let i = 0; i < accessionNumbers.length; i++) {
      const filingDate = new Date(filingDates[i]); // convert to Date object
      if (filingDate >= startDate && filingDate <= endDate) {
        // Filing is within date range

        const accessionNumber = accessionNumbers[i].replace(/-/g, "");
        const primaryDocument = primaryDocuments[i];

        const url_ = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`;

        if (filingForms[i] == searchForm) {
          urls.push(url_);
        }
      }
    }
    return urls;
  } catch (error) {
    logger.error(`Error fetching filings: ${error}`);
  }
}

// Get HTML for filing

async function getHTMLFromFiling(url) {
  try {
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    logger.error(`Error fetching HTML: ${error}`);
  }
}

// Throttle requests

async function throttle() {
  await new Promise((resolve) => setTimeout(resolve, 110));
}

// Parse HTML

function parseHTML(html) {
  const $ = cheerio.load(html);

  // Parse HTML here

  return parsedData;
}

// Save parsed data

function saveData(data) {
  fs.writeFileSync("parsed.json", JSON.stringify(data));
}

async function main() {
  await readFirms();

  commander

    .option("-f, --search_form <search_form>", "filing forms to search")

    .option("-s, --start <start>", "start date")

    .option("-e, --end <end>", "end date")

    .option("-t, --ticker <ticker>", "company ticker symbol")

    .parse(process.argv);

  const options = commander.opts();
  console.log("options", options);

  const firm = firms.filter((f) => f.ticker == options.ticker);

  if (!firm) {
    console.error("Ticker not found");

    return;
  }

  const filings = await getAllFilings(
    firm,
    options.search_form,
    new Date(options.start),
    new Date(options.end)
  );
  console.log(filings);
  for (let filing of filings) {
    console.log(filing);
    const html = await getHTMLFromFiling(filing);
    await throttle(); // Add delay between requests
    const parsed = parseHTML(html);
    saveData(parsed);
  }
}

main();
