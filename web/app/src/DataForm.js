import React, { useState, useEffect } from "react";
import { Form, Button, Col, Row } from "react-bootstrap";
import axios from "axios";
import cheerio from "cheerio";
import parse from "html-react-parser";
import { formFields, initialFormData } from "./util";

// https://raw.githubusercontent.com/MilkMilks/nasdaq_listing_data/main/listing.csv
// const url_ = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`
export default function DataForm() {
  const [htmlContent, setHtmlContent] = useState("");
  const [showHtml, setShowHtml] = useState(false);
  const [fileId, setFileId] = useState(0);
  const [totalFilesLength, setTotalFilesLength] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [keyPressed, setKeyPressed] = useState(null);
  const [enteredTicker, setEnteredTicker] = useState("");
  const [currentCik, setcurrentCik] = useState([]);
  const [fullUrl, setFullUrl] = useState("");
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
    axios.get(`/get-html-file/${fileId}`).then((res) => {
      setFullUrl(res.data.filing_url);
      setAllFiles(res.data.htmlFiles);
      let $ = cheerio.load(res.data.html);
      let bodyHTML = $("text").html();
      $ = cheerio.load(bodyHTML);
      const baseUrl = res.data.filing_url.split("/").slice(0, -1).join("/");

      $("img").each(function () {
        let src = $(this).attr("src");

        // src doesn't start with "/" but still needs updating
        console.log("baseurl", baseUrl);
        if (!src.startsWith("http")) {
          $(this).attr("src", `${baseUrl}/${src}`);
        }
      });

      // Remove all non-whitelisted tags
      const newHtml = $.html();
      setHtmlContent(newHtml);

      ///end
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
      setcurrentCik(res.data.cik);
      if (!totalFilesLength) {
        setTotalFilesLength(res.data.TOTAL_FILE_LENGTH);
      }

      setFormData({
        date: date || res.data.filingDate || "",
        adsh: adsh || res.data.accessionNumber || "",
        firm: firm || res.data.firm || "ERROR",
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

  // Function to reset formData
  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const handleTickerChange = async () => {
    console.log("enteredTicker", enteredTicker);
    // find url containing cik
    if (enteredTicker.length) {
      let fileIdMatch = allFiles.findIndex((url) => {
        const name = url.split("\\")[2];
        return name === enteredTicker;
      });

      console.log("First Row of ticker found: ", fileIdMatch);

      if (fileIdMatch && fileIdMatch >= 0) {
        console.log("fileIdMatch", fileIdMatch, " <--- here?");

        await axios.post("/update-observations", formData);
        setFileId(fileIdMatch);
        resetFormData();
        setEnteredTicker(""); // reset input value
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
    resetFormData();
  };

  const handleForward = async () => {
    await axios.post("/update-observations", formData);
    let newId = fileId + 1;
    if (newId > totalFilesLength - 1) {
      newId = 0;
    }

    setFileId(newId);
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

          window.open(fullUrl);
        }}
      >
        CHECK FILING DOC
      </Button>
      <Button
        onClick={() => {
          //match the ticker (firm) with the cik in fetchedCIKs
          //disect fullUrl to get ticker
          // https://www.sec.gov/Archives/edgar/data/1621221/000164033422001134/artl_def14a.htm/2022-05-26___artl
          const cik = fullUrl.split("/")[6];
          const googleFirm = `https://www.google.com/search?q=${formData.firm} investor relations`;
          window.open(googleFirm);
        }}
      >
        GOOGLE IT
      </Button>
      <Form.Control
        type="text"
        onChange={(e) => {
          setEnteredTicker(e.target.value);
        }}
      />

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
      <Button onClick={() => setShowHtml((prev) => !prev)}>
        {showHtml ? "Hide" : "Show"} HTML
      </Button>
      {showHtml && <div>{parse(htmlContent)}</div>}
    </div>
  );
}
