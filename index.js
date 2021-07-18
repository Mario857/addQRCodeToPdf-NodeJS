const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const app = express();
const server = http.createServer(app);
const { PDFDocument } = require("pdf-lib");
const QRCode = require("qrcode");
const Joi = require("joi");
const { readFile, writeFile, unlink } = require("fs/promises");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const dir = "public";
const subDirectory = "public/uploads";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);

  fs.mkdirSync(subDirectory);
}

const generateQRCodeImage = async function (filePath, text, color) {
  new Promise((resolve, reject) => {
    QRCode.toFile(
      filePath,
      text,
      {
        color,
      },
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

const run = async ({
  width,
  height,
  x,
  y,
  pathToImage,
  pathToPDF,
  pathToOutputPDF,
  qrCodeText,
  qrDarkColor = "#000",
  qrLightColor = "#0000",
}) => {
  await generateQRCodeImage(pathToImage, qrCodeText, {
    dark: qrDarkColor,
    light: qrLightColor,
  });

  const pdfDoc = await PDFDocument.load(await readFile(pathToPDF));
  const img = await pdfDoc.embedPng(await readFile(pathToImage));

  Array.from({ length: pdfDoc.getPageCount() }).forEach((_, index) => {
    let imagePage = pdfDoc.getPage(index);
    imagePage.drawImage(img, {
      x,
      y,
      width,
      height,
    });
  });

  const pdfBytes = await pdfDoc.save();

  await writeFile(pathToOutputPDF, pdfBytes);
};

const pdfFileFilter = function (req, file, callback) {
  const ext = path.extname(file.originalname);

  if (ext !== ".pdf") {
    return callback("This extension is not supported");
  }
  callback(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const filesToProcess = multer({ storage: storage, fileFilter: pdfFileFilter });

const schema = Joi.object({
  width: Joi.string().regex(/^\d+$/).required(),
  height: Joi.string().regex(/^\d+$/).required(),
  x: Joi.string().regex(/^\d+$/).required(),
  y: Joi.string().regex(/^\d+$/).required(),
  qrCodeData: Joi.string().required(),
  qrDarkColor: Joi.string(),
  qrLightColor: Joi.string(),
});

app.post("/addQrToPdf", filesToProcess.array("file", 1), async (req, res) => {
  const pathToImage = "public/uploads/" + Date.now() + "temp-qr.png";
  const pathToOutputPDF = "public/uploads/" + Date.now() + "-output.pdf";

  if (req.files) {
    const [file] = req.files;

    if (!file) {
      res.send("No file detected on input");
    }

    const pathToPDF = file.path;

    try {
      const { width, height, x, y, qrCodeData, qrDarkColor, qrLightColor } =
        await schema.validateAsync(req.body);

      await run({
        width: +width,
        height: +height,
        x: +x,
        y: +y,
        qrDarkColor,
        qrLightColor,
        qrCodeText: qrCodeData,
        pathToImage,
        pathToOutputPDF,
        pathToPDF,
      });

      const pdfFile = await readFile(pathToOutputPDF);
      res.contentType("application/pdf");
      res.send(pdfFile);

      await unlink(pathToImage);
      await unlink(pathToPDF);
      await unlink(pathToOutputPDF);
    } catch (error) {
      try {
        await unlink(pathToPDF);
        await unlink(pathToImage);
      } catch (err) {
        console.warn(err);
      }
      res.send(error);
    }
  }
});

server.listen(4000, () => console.log("listening on port *:4000"));
