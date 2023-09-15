const fs = require("fs");

const firmsData = fs.readFileSync("nasdaq_firms.csv", "utf8").split("\n");
const urlsData = fs.readFileSync("urls_extracted.txt", "utf8").split("\n");

console.log(firmsData.length, urlsData.length);
const ciks = [];
for (let i = 0; i < firmsData.length; i++) {
  const firmCik = firmsData[i].split(",")[1];
  ciks.push(firmCik);
}

let filteredUrls = [];
// fs.writeFileSync("out_putzz.tsv", filteredUrls.join("\n"));
for (let j = 0; j < urlsData.length; j++) {
  const url = urlsData[j];
  const urlCik = Number(url.split("/")[6]);
  if (ciks.some((cik) => cik == urlCik)) {
    console.log(urlCik);
    filteredUrls.push(url);
  }
}
//WRITE TO FILE
fs.writeFileSync("out_putzz.tsv", filteredUrls.join("\n"));
