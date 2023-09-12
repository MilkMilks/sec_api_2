import React, { useState, useEffect } from "react";
import { Form, Button, Col, Row } from "react-bootstrap";
import axios from "axios";
import cheerio from "cheerio";
import parse from "html-react-parser";
import { formFields, initialFormData } from "./util";

export default function DataForm() {
  const [expandedTables, setExpandedTables] = useState([]);
  const [expandedTable, setExpandedTable] = useState(-1);
  const [htmlContent, setHtmlContent] = useState("");
  const [tables, setTables] = useState([]);
  const [fileId, setFileId] = useState(0);
  const [totalFilesLength, setTotalFilesLength] = useState(0);
  const [formData, setFormData] = useState(initialFormData);

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

  return (
    <div style={{ padding: "15px" }}>
      <Button style={{ margin: "5px" }} onClick={handleBack}>
        Back
      </Button>
      <Button style={{ margin: "5px" }} onClick={handleForward}>
        Forward
      </Button>
      <Row style={{ padding: "10px" }}>
        {formFields.map((field) => {
          // console.log(formData);
          // currentFirmInfo.firm
          return (
            <Col md={1}>
              <Form.Group key={field.id} controlId={field.id}>
                <Form.Label>{field.label}</Form.Label>
                <Form.Control
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
              Firm: <br />
              <span style={{ color: "blue" }}>FILING ORDER# {fileId + 1}</span>
            </u>
          </h3>
        </Col>
        <Col md={3}>
          <h3>
            <u>
              Firm: <br />
              <span style={{ color: "blue" }}>{formData.firm}</span>
            </u>
          </h3>
        </Col>
        <Col md={3}>
          <h3>
            <u>
              Date: <br />
              <span style={{ color: "red" }}>{formData.date}</span>
            </u>
          </h3>
        </Col>
        <Col md={3}>
          <h3>
            <u>
              Accession Number: <br />{" "}
              <span style={{ color: "green" }}>{formData.adsh}</span>
            </u>
          </h3>
        </Col>
      </Row>
      {/* Add a horizontal line */}
      <hr style={{ border: "none", borderTop: "1px solid red" }} />
      {tables &&
        tables.map((table, index) => (
          <button style={{ margin: "2px" }} onClick={() => toggleTable(index)}>
            Table {index + 1}
          </button>
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
