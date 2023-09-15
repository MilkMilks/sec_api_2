import React, { useState, useEffect } from "react";
import { Form, Button, Col, Row } from "react-bootstrap";
import axios from "axios";
import cheerio from "cheerio";
import parse from "html-react-parser";
import { formFields, initialFormData } from "./util";

// https://raw.githubusercontent.com/MilkMilks/nasdaq_listing_data/main/listing.csv
// const url_ = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`
export default function DataForm() {
  const [expandedTables, setExpandedTables] = useState([]);
  const [expandedTable, setExpandedTable] = useState(-1);
  const [htmlContent, setHtmlContent] = useState("");
  const [tables, setTables] = useState([]);
  const [fileId, setFileId] = useState(0);
  const [totalFilesLength, setTotalFilesLength] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [urls, setUrls] = useState([]);
  const [fetchedCIKs, setFetchedCIKs] = useState([]);
  const [keyPressed, setKeyPressed] = useState(null);
  const [enteredTicker, setEnteredTicker] = useState("");
  const [allFiles, setAllFiles] = useState([]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeyPressed(e.keyCode);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  useEffect(() => {
    handleTickerChange(enteredTicker);
  }, [enteredTicker]);

  useEffect(() => {
    if (keyPressed === 37) {
      handleBack();
    }

    if (keyPressed === 39) {
      handleForward();
    }

    setKeyPressed(null);
  }, [keyPressed]);
  useEffect(() => {
    axios
      .get(
        "https://raw.githubusercontent.com/MilkMilks/nasdaq_listing_data/main/egar2020"
      )
      .then((res) => {
        setUrls(res.data.split("\n"));
      });
  }, []);

  useEffect(() => {
    axios
      .get(
        "https://raw.githubusercontent.com/MilkMilks/nasdaq_listing_data/main/listing.csv"
      )
      .then((res) => {
        let temp = res.data.split("\n");
        setFetchedCIKs(temp);
      });
  }, []);

  useEffect(() => {
    axios.get(`/get-html-file/${fileId}`).then((res) => {
      setHtmlContent(res.data.html);
      setTables([]);
      let [
        date,
        adsh,
        firm,
        source,
        black,
        male,
        female,
        lgbt,
        non_binary,
        asian,
        latinx,
        no_answer,
        directors,
        notes,
      ] = res.data.filing_row[0] ? res.data.filing_row[0].split("\t") : [];

      if (!totalFilesLength) {
        setTotalFilesLength(res.data.TOTAL_FILE_LENGTH);
        setAllFiles(res.data.filing_paths.split("\n"));
      }

      setFormData({
        date: date || res.data.filingDate || "123",
        adsh: adsh || res.data.accessionNumber || "",
        firm: firm || res.data.firm.split(" ")[0] || "NA",
        source: source || "proxy",
        black: black || "",
        male: male || "",
        female: female || "",
        lgbt: lgbt || "",
        non_binary: non_binary || "",
        asian: asian || "",
        latinx: latinx || "",
        no_answer: no_answer || "",
        directors: directors || "",
        notes: notes || "",
      });
    });
  }, [fileId]);

  useEffect(() => {
    // Parse logic
    const $ = cheerio.load(htmlContent);

    $("table").each((i, elem) => {
      // Directly update state
      setTables((prev) => [...prev, $(elem).html()]);
    });
  }, [htmlContent]);

  const toggleTable = (index) => {
    setExpandedTable((prev) => (prev === index ? -1 : index));
  };

  // Function to reset formData
  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const handleTickerChange = async () => {
    console.log("enteredTicker", enteredTicker);
    // find url containing cik
    if (enteredTicker.length) {
      let fileIdMatch = allFiles.findIndex((url) => {
        const name = url.split("\\")[1];
        return name === enteredTicker;
      });

      console.log("First Row of ticker found: ", fileIdMatch);

      if (fileIdMatch && fileIdMatch >= 0) {
        console.log("fileIdMatch", fileIdMatch, " <--- here?");
        console.log("formData", formData);
        await axios.post("/update-observations", formData);
        setFileId(fileIdMatch);
        setExpandedTable(-1);
        setExpandedTables([]);
        resetFormData();
      } else {
        console.log("fileIdMatch", fileIdMatch, " <--- not here?");
        console.log("No match found");
      }
    } else if (enteredTicker.length > 5) {
      console.log("Too many characters, 5 max ticker length.");
    }
  };

  const handleBack = async () => {
    await axios.post("/update-observations", formData);
    let newId = fileId - 1;
    if (newId < 0) {
      console.log("fileId", fileId);
      console.log("newId", newId);
      console.log("totalFilesLength", totalFilesLength - 1);
      newId = totalFilesLength - 1;
    }

    setFileId(newId);
    setExpandedTable(-1);
    setExpandedTables([]);
    resetFormData();
  };

  const handleForward = async () => {
    await axios.post("/update-observations", formData);
    let newId = fileId + 1;
    if (newId > totalFilesLength - 1) {
      newId = 0;
    }

    setFileId(newId);
    setExpandedTable(-1);
    setExpandedTables([]);
    resetFormData();
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // send entire formData object
    axios
      .post("/update-observations", formData)
      .then((response) => {
        console.log("Data updated");
      })
      .catch((error) => {
        console.log("Error updating data", error);
      });
  };
  let colorz = { color: "#DC143C" };
  // Handle key press

  return (
    <div style={{ padding: "15px" }}>
      <Button style={{ color: "#DC143C", margin: "5px" }} onClick={handleBack}>
        Back
      </Button>
      <Button
        style={{ color: " #28C9AF", margin: "5px" }}
        onClick={handleForward}
      >
        Forward
      </Button>
      <Button
        onClick={() => {
          //match the ticker (firm) with the cik in fetchedCIKs
          let cik = "";
          let ticker = formData.firm;
          for (let i = 0; i < fetchedCIKs.length; i++) {
            let row = fetchedCIKs[i].split(",");
            if (row[0] == ticker) {
              console.log("row: ", row);
              cik = row[0];
              break;
            }
          }
          //mow match the cik in urls var
          // https://www.sec.gov/Archives/edgar/data/${cik}/${formData.adsh}/${primaryDocument}
          let primaryDocument = "";
          for (let i = 0; i < urls.length; i++) {
            let parts = urls[i].split("/");
            if (urls[i].includes(cik) && urls[i].includes(formData.adsh)) {
              primaryDocument = parts[parts.length - 1];
              break;
            }
          }

          const fullUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${formData.adsh}/${primaryDocument}`;

          console.log("Full URL:", fullUrl);

          window.open(fullUrl);
        }}
      >
        CHECK FILING DOC
      </Button>
      <Form.Control
        type="text"
        onChange={(e) => {
          setEnteredTicker(e.target.value);
        }}
      />
      <Button onClick={handleTickerChange}>GO TO TICKER</Button>
      CHECK FILING DOCzz
      <Row style={{ padding: "10px" }} className="justify-content-center">
        {formFields.map((field) => {
          // console.log(formData);
          // currentFirmInfo.firm
          return (
            <Col md={1}>
              <Form.Group key={field.id} controlId={field.id}>
                <Form.Label>{field.label}</Form.Label>
                <Form.Control
                  size="sm"
                  onChange={(e) =>
                    handleFieldChange(e.target.name, e.target.value)
                  }
                  type={field.type}
                  name={field.id}
                  placeholder={formData[field.id]}
                  value={formData[field.id] || 0}
                  required={field.required}
                />
              </Form.Group>
            </Col>
          );
        })}
      </Row>
      <Row>
        {/* fileId */}
        <Col md={3}>
          <h3>
            <u>
              ROW #: <br />
              <span style={{ color: " #28C9AF" }}>{fileId}</span>
            </u>
          </h3>
        </Col>
        <Col md={3}>
          <h3>
            <u>
              Firm: <br />
              <span style={colorz}>{formData.firm}</span>
            </u>
          </h3>
        </Col>
        <Col md={3}>
          <h3>
            <u>
              Date: <br />
              <span style={{ color: " #28C9AF" }}>{formData.date}</span>
            </u>
          </h3>
        </Col>
        <Col md={3}>
          <h3>
            <u>
              ADSH: <br />
              <span style={colorz}>{formData.adsh}</span>
            </u>
          </h3>
        </Col>
      </Row>
      {/* Add a horizontal line */}
      <hr style={{ border: "none", borderTop: "1px solid red" }} />
      {tables &&
        tables.map((table, index) => (
          <Button
            style={{ color: " #28C9AF", margin: "2px" }}
            onClick={() => toggleTable(index)}
          >
            Table {index + 1}
          </Button>
        ))}
      {tables &&
        tables.map((table, index) => {
          if (expandedTable === index) {
            return (
              <div key={index} suppressHydrationWarning={true}>
                {parse(table)}
              </div>
            );
          }

          return null;
        })}
    </div>
  );
}
