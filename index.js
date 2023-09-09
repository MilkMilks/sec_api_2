const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio"); // for parsing HTML

// Read nasdaq firms file
const firms = [];

function readFirms() {
  const data = fs.readFileSync("./nasdaq_firms.tsv", "utf8");

  data.split("\n").forEach((line) => {
    const [cik, ticker] = line.trim().split("\t");
    firms.push({ cik, ticker });
  });
}
readFirms();

// Get all filings for a CIK
const getAllFilings = async (cik, requested_forms, start_date, end_date) => {
  // Convert cik to string

  let cikStr = cik;

  // Prepend zeros until length is 10
  while (cikStr.length != 10) {
    cikStr = "0" + cikStr;
  }

  const url = `https://data.sec.gov/submissions/CIK${cikStr}.json`;
  console.log(url);
  try {
    const headers = {
      "User-Agent": "Personal evan@kasukedo.com",
      "Accept-Encoding": "gzip, deflate",
    };

    const response = await axios.get(url, { headers });
    const submissions = response.data;
    // console.log("submissions", submissions);
    // Extract filing URLs from response
    // const filingUrls = response.data.filings.file.map((f) => f.url);
    // console.log("filingUrls", filingUrls);
    const filingUrls = submissions.filings.recent;
    console.log(Object.keys(filingUrls));
    // [
    //   'accessionNumber',
    //   'filingDate',
    //   'reportDate',
    //   'acceptanceDateTime',
    //   'act',
    //   'form',
    //   'fileNumber',
    //   'filmNumber',
    //   'items',
    //   'size',
    //   'isXBRL',
    //   'isInlineXBRL',
    //   'primaryDocument',
    //   'primaryDocDescription'
    // ]
    let filingsMetadata = [];

    Object.keys(submissions).forEach((key) => {
      if (key !== "filings") {
        filingsMetadata.push(submissions[key]);
      }
    });

    // console.log(filingsMetadata);
    const {
      accessionNumber: accessionNumbers,
      filingDate: filingDates,
      reportDate: reportDates,
      form: forms,
      primaryDocument: primaryDocuments,
    } = filingUrls;

    const urls = accessionNumbers.map((_, i) => {
      let accessionNumber = accessionNumbers[i].replace(/-/g, "");
      let filingDate = filingDates[i];
      let reportDate = reportDates[i];
      let form = forms[i];
      let primaryDocument = primaryDocuments[i];
      console.log(
        `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`
      );
      return `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`;
    });

    // console.log("adsh ", accessionNumbers);
    return filingUrls;
  } catch (err) {
    console.error(`Error fetching filings: ${err}`);
  }
};

// Get HTML content from a filing URL
const getHTMLfromFiling = async (url) => {
  try {
    // const response = await axios.get(url);
    return response.data;
  } catch (err) {
    console.error(`Error fetching HTML: ${err}`);
  }
};

// Loop through firms and get filings
let x = 0;
const go = async (options) => {
  // console.log(firms);
  for (let i = 1; i < firms.length; i++) {
    const firm = firms[i];
    x++;
    if (x > 2) {
      break;
    }
    // console.log(`Getting filings for ${firm.cik}...`);
    const filingUrls = await getAllFilings(firm.cik);
    // console.log(`filingUrls: ${i}`, filingUrls);
    // for (let url of filingUrls) {
    //   const html = await getHTMLfromFiling(url);

    //   // Parse HTML with cheerio here
    //   const $ = cheerio.load(html);
    // ... extract data
    // }
  }
};
const options = {};
go();
