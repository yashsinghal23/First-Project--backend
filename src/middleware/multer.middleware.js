import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
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