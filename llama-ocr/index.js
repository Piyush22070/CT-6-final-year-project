import express from "express";
import multer from "multer";
import path from "path";
import { ocr } from './src/ocr.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.post("/ocr", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded." });
    }

    const markdown = await ocr({
      filePath: req.file.path,
      apiKey: process.env.TOGETHER_API_KEY,
    });

    res.json({ markdown });
  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: "OCR failed." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
