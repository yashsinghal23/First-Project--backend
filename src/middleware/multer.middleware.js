import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = path.join(process.cwd(), "public", "temp");

// Ensure the upload directory exists at startup (it isn't committed to git,
// and won't exist on a fresh server/deploy unless created here).
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({
    storage,
    limits:{
        fileSize:5*1024*1024
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== "application/pdf") {
            const err = new Error("Only PDF files are allowed.");
            err.statusCode = 400;
            return cb(err);
        }
        cb(null, true);
    }
})

export default upload;