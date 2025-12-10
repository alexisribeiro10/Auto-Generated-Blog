import { pool } from "../db.js";
import { generateArticle } from "./aiClient.js";

/**
 * Generate and save a new article to the database
 * @param {string} topic - Optional topic for the article
 * @returns {Promise<Object>} The created article
 */
export async function createGeneratedArticle(topic = null) {
  try {
    console.log(`Generating article${topic ? ` about: ${topic}` : ""}...`);

    // Generate article using AI
    const { title, content } = await generateArticle(topic);

    // Save to database
    const { rows } = await pool.query(
      "INSERT INTO articles (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at",
      [title, content]
    );

    console.log(`Article created successfully: "${title}"`);
    return rows[0];
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
}