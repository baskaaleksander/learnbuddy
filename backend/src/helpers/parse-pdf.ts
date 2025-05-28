import axios from "axios";
const pdfParse = require("pdf-parse");

export async function parsePublicPdfFromS3(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, "binary");

    const parsed = await pdfParse(buffer);
    console.log(parsed.text);
    return parsed.text;
  } catch (error) {
    return `Error parsing PDF: ${error.message}`;
  }
}