import { Router } from "express";
import { pool } from "../db.js";
import { createGeneratedArticle } from "../services/articleGenerator.js";

const router = Router();

// List all articles
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, content, created_at FROM articles ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one article
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, content, created_at FROM articles WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Generate new article (for testing/manual trigger)
router.post("/generate", async (req, res) => {
  try {
    const topic = req.body?.topic || null;
    const article = await createGeneratedArticle(topic);
    res.status(201).json(article);
  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({ error: err.message });
  }
});


// Delete
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM articles WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;