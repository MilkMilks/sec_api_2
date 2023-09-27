const fs = require("fs");

// Read the JSON data from the file
const jsonData = fs.readFileSync("urls_fetched_final2_.txt", "utf8");

try {
  // Parse the JSON into an array of arrays containing single JSON objects
  const arrayOfArrays = jsonData.split("\n").map((line) => {
    try {
      return JSON.parse(line);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return null;
    }
  });

  // Use flatMap to extract the url_ values from each object in all arrays and flatten them into a single array
  const flattenedUrls = arrayOfArrays
    .filter((arr) => arr && arr.length > 0) // Remove any empty arrays or failed parsing results
    .flatMap((arr) => arr.map((obj) => obj.url_));

  // Write the flattened URLs to a new file
  fs.writeFileSync("flattened_urls.txt", flattenedUrls.join("\n"));

  console.log("Flattened URLs written to flattened_urls.txt");
} catch (readError) {
  console.error("Error reading file:", readError);
}
