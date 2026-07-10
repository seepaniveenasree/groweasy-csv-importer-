require("dotenv").config();
const express = require("express");
const cors = require("cors");
const importRoute = require("./routes/import");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", provider: process.env.AI_PROVIDER || "gemini" });
});

app.use("/api", importRoute);

// Centralized error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`GrowEasy CSV Importer backend running on port ${PORT}`);
  console.log(`AI provider: ${process.env.AI_PROVIDER || "gemini"}`);
});
