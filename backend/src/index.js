import "dotenv/config";
import express from "express";
import cors from "cors";
import articlesRouter from "./routes/articles.js";
import { pool } from "./db.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", db_time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/articles", articlesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));