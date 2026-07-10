const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const okMime = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    const okExt = file.originalname.toLowerCase().endsWith(".csv");
    if (okExt || okMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .csv files are accepted."));
    }
  },
});

module.exports = upload;
