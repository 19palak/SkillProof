import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { PinataSDK } from "pinata";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
});

app.get("/", (req, res) => {
  res.json({
    message: "SkillProof backend is running",
  });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        error: "Only PDF files are allowed",
      });
    }

    console.log("Received file:", req.file.originalname);
    console.log("File size:", req.file.size);

    const file = new File(
      [req.file.buffer],
      req.file.originalname,
      {
        type: req.file.mimetype,
      }
    );

    const result = await pinata.upload.public
      .file(file)
      .name(req.file.originalname);

    console.log("Uploaded to IPFS:", result.cid);

    res.json({
      success: true,
      cid: result.cid,
      ipfsURI: `ipfs://${result.cid}`,
    });

  } catch (error) {
    console.error("IPFS upload error:", error);

    res.status(500).json({
      error: "Failed to upload file to IPFS",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `SkillProof backend running on http://localhost:${PORT}`
  );
});