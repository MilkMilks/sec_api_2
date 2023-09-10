import React, { useState, useEffect } from "react";
import { Form, Button, Col, Row } from "react-bootstrap";
import axios from "axios";
import cheerio from "cheerio";
import parse from "html-react-parser";

const formFields = [
  {
    id: "firm",
    label: "Firm:",
    type: "text",
    required: true,
  },
  {
    id: "proxy",
    label: "Proxy:",
    type: "text",
    required: true,
  },
  {
    id: "website",
    label: "Website:",
    type: "text",
    required: true,
  },
  {
    id: "latino",
    label: "Latino:",
    type: "text",
    required: true,
  },
  {
    id: "black",
    label: "Black:",
    type: "text",
    required: true,
  },
  {
    id: "male",
    label: "Male:",
    type: "text",
    required: true,
  },
  {
    id: "female",
    label: "Female:",
    type: "text",
    required: true,
  },
  {
    id: "lgbt",
    label: "LGBT:",
    type: "text",
    required: true,
  },
  {
    id: "total_directors",
    label: "Directors:",
    type: "text",
    required: true,
  },
];

export default function DataForm() {
  const [formData, setFormData] = useState({
    firm: "",
    proxy: "",
    website: "",
    latino: "",
    black: "",
    male: "",
    female: "",
    lgbt: "",
    directors: "",
    year: "",
  });
  const [expandedTables, setExpandedTables] = useState([]);
  const [expandedTable, setExpandedTable] = useState(-1);
  const [htmlContent, setHtmlContent] = useState("");
  const [tables, setTables] = useState([]);
  const [fileId, setFileId] = useState(0);
  const [currentFirmInfo, setCurrentFirmInfo] = useState({});
  const initialFormData = {
    firm: "",
    proxy: "",
    website: "",
    latino: "",
    black: "",
    male: "",
    female: "",
    lgbt: "",
    directors: "",
    year: "",
  };
  useEffect(() => {
    axios.get(`/get-html-file/${fileId}`).then((res) => {
      setHtmlContent(res.data.html);
      setTables([]);
      setCurrentFirmInfo({
        firm: res.data.firm,
        filing: res.data.filingDate,
        accessionNumber: res.data.accessionNumber,
      });

      const [formData, setFormData] = useState(initialFormData);

      setFormData({
        ...formData,
        firm: res.data.firm,
        proxy: true,
        year: res.data.filingDate,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  const toggleTable = (index) => {
    setExpandedTable((prev) => (prev === index ? -1 : index));
  };

  // Function to reset formData
  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const handleBack = () => {
    setFileId((id) => id - 1);
    setExpandedTable(-1);
    setExpandedTables([]);
    resetFormData();
  };

  const handleForward = () => {
    setFileId((id) => id + 1);
    setExpandedTable(-1);
    setExpandedTables([]);
    resetFormData();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
          // currentFirmInfo.firm
          return field.id !== "firm" ? (
            <Col md={1}>
              <Form.Group key={field.id} controlId={field.id}>
                <Form.Label>{field.label}</Form.Label>
                <Form.Control
                  type={field.type}
                  name={field.id}
                  placeholder={formData[field.id]}
                  value={formData[field.id]}
                  onChange={handleChange}
                  required={field.required}
                />
              </Form.Group>
            </Col>
          ) : (
            <Col md={1}>
              <Form.Group key={field.id} controlId={field.id}>
                <Form.Label>{field.label}</Form.Label>
                <Form.Control
                  type={field.type}
                  name={field.id}
                  placeholder={currentFirmInfo.firm}
                  defaultValue={currentFirmInfo.firm}
                  value={currentFirmInfo.firm}
                  onChange={handleChange}
                  required={field.required}
                />
              </Form.Group>
            </Col>
          );
        })}
        <Col md={1}>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <h3>
            <u>
              Firm: <br />
              <span style={{ color: "blue" }}>{currentFirmInfo.firm}</span>
            </u>
          </h3>
        </Col>
        <Col md={4}>
          <h3>
            <u>
              Filing: <br />
              <span style={{ color: "red" }}>{currentFirmInfo.filing}</span>
            </u>
          </h3>
        </Col>
        <Col md={4}>
          <h3>
            <u>
              Accession Number: <br />{" "}
              <span style={{ color: "green" }}>
                {currentFirmInfo.accessionNumber}
              </span>
            </u>
          </h3>
        </Col>
      </Row>
      {/* Add a horizontal line */}
      <hr style={{ border: "none", borderTop: "1px solid red" }} />
      {tables.map((table, index) => (
        <button style={{ margin: "2px" }} onClick={() => toggleTable(index)}>
          Table {index + 1}
        </button>
      ))}

      {tables.map((table, index) => {
        if (expandedTable === index) {
          return (
            <div>
              {/* <div dangerouslySetInnerHTML={{ __html: table }} /> */}
              {parse(table)}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
