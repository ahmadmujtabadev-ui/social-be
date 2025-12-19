// upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

const isVercel = true;

// IMPORTANT: Vercel writable path is only /tmp
const UPLOAD_DIR = isVercel
  ? "/tmp/uploads"
  : path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const name = path
      .basename(file.originalname || "file", ext)
      .replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

// IMPORTANT: .any() so bracketed names won't crash Multer
export const upload = multer({ storage }).any();
