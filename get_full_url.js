// const axios = require("axios");
// const fs = require("fs");

// const firms = [];

// async function readFirms() {
//   const data = fs.readFileSync("./MISSING_FIRMS_FINAL.csv", "utf8");
//   data.split("\n").forEach((line, i) => {
//     let [ticker, cik] = line.trim().split(",");
//     ticker = ticker.toLowerCase();
//     if (i > 0 && !firms.find((firm) => firm.cik === cik)) {
//       // console.log(`${cik} already exists`);
//       firms.push({
//         cik,
//         ticker,
//       });
//     }
//   });
// }

// async function getAllFilings(cik_or_ticker, searchForm, startDate, endDate) {
//   try {
//     cik_or_ticker = cik_or_ticker[0] || cik_or_ticker;
//     const cik = cik_or_ticker.cik;
//     const ticker = cik_or_ticker.ticker;
//     const cikPadded = cik.padStart(10, "0");
//     const url = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;

//     const response = await axios.get(url);
//     const submissions = response.data;
//     const filingUrls = submissions.filings.recent;

//     const {
//       accessionNumber: accessionNumbers,
//       filingDate: filingDates,
//       primaryDocument: primaryDocuments,
//       form: filingForms,
//     } = filingUrls;

//     const urls = [];
//     for (let i = 0; i < accessionNumbers.length; i++) {
//       const filingDate = new Date(filingDates[i]);

//       const startDate2 = new Date(startDate);
//       const endDate2 = new Date(endDate);
//       if (filingDate >= startDate2 && filingDate <= endDate2) {
//         const accessionNumber = accessionNumbers[i].replace(/-/g, "");
//         const primaryDocument = primaryDocuments[i];
//         const url_ = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}/${filingDates[i]}/${ticker}`;
//         if (filingForms[i] == searchForm) {
//           urls.push({ url_, filingDate, accessionNumber, ticker });
//         }
//       }
//     }
//     if (!urls.length || urls.length == 0) {
//       // Append the entire submissions object to another file for diagnosis
//       fs.appendFileSync(
//         "submissions_data_error.json",
//         "\n" + JSON.stringify(submissions, null, 2),
//         {
//           encoding: "utf8",
//         }
//       );
//     }

//     // Return an empty array if there are no filings
//     if (urls.length === 0) {
//       return [];
//     }
//     return urls;
//   } catch (error) {
//     console.error(`Error fetching filings: ${error}`);
//   }
// }

// function saveURLsToFile(urls) {
//   const data = JSON.stringify(urls);
//   //dont write empty or null data
//   if (urls.length > 0) {
//     fs.appendFileSync("urls_fetched_final2_.txt", "\n" + data, {
//       encoding: "utf8",
//     });
//   }
// }

// async function main() {
//   await readFirms();
//   for (let firm of firms) {
//     const filings = await getAllFilings(
//       firm,
//       "DEF 14A",
//       "2022-01-01",
//       "2022-12-31"
//     );
//     const urls = filings.map((filing) => {
//       return { url_: filing.url_ };
//     });
//     saveURLsToFile(urls);
//   }
// }

// main();
const axios = require("axios");
const fs = require("fs");

const firms = [];

async function readFirms() {
  const data = fs.readFileSync("./MISSING_FIRMS_FINAL.csv", "utf8");
  data.split("\n").forEach((line, i) => {
    let [ticker, cik] = line.trim().split(",");
    ticker = ticker.toLowerCase();
    if (i > 0 && !firms.find((firm) => firm.cik === cik)) {
      firms.push({
        cik,
        ticker,
      });
    }
  });
}

async function getAllFilings(cik_or_ticker, searchForm, startDate, endDate) {
  try {
    cik_or_ticker = cik_or_ticker[0] || cik_or_ticker;
    const cik = cik_or_ticker.cik;
    const ticker = cik_or_ticker.ticker;
    const cikPadded = cik.padStart(10, "0");
    const url = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;

    const response = await axios.get(url);
    const submissions = response.data;
    const filingUrls = submissions.filings.recent;

    const {
      accessionNumber: accessionNumbers,
      filingDate: filingDates,
      primaryDocument: primaryDocuments,
      form: filingForms,
    } = filingUrls;

    const urls = [];
    for (let i = 0; i < accessionNumbers.length; i++) {
      const filingDate = new Date(filingDates[i]);

      const startDate2 = new Date(startDate);
      const endDate2 = new Date(endDate);
      if (filingDate >= startDate2 && filingDate <= endDate2) {
        const accessionNumber = accessionNumbers[i].replace(/-/g, "");
        const primaryDocument = primaryDocuments[i];
        const url_ = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}/${filingDates[i]}___${ticker}`;
        if (filingForms[i] == searchForm) {
          urls.push({ url: `${url_}` }); // Include cik and ticker in the URL
        }
      }
    }
    if (!urls.length || urls.length == 0) {
      fs.appendFileSync(
        "submissions_data_error.json",
        "\n" + JSON.stringify(submissions, null, 2),
        {
          encoding: "utf8",
        }
      );
    }

    if (urls.length === 0) {
      return [];
    }
    return urls;
  } catch (error) {
    console.error(`Error fetching filings: ${error}`);
  }
}

function saveURLsToFile(urls) {
  const urlStrings = urls.length && urls.map((urlObj) => urlObj.url);
  if (urlStrings.length > 0) {
    fs.appendFileSync(
      "urls_fetched_final2_.txt",
      urlStrings.join("\n") + "\n",
      {
        encoding: "utf8",
      }
    );
  }
}

async function main() {
  await readFirms();

  for (let firm of firms) {
    const filings = await getAllFilings(
      firm,
      "DEF 14A",
      "2022-01-01",
      "2022-12-31"
    );

    saveURLsToFile(filings);
  }
}

main();
