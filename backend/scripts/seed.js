import "dotenv/config";
import { pool } from "../src/db.js";

const seedRows = [
  {
    title: "Welcome to the Auto Blog",
    content: "This is your first seeded article.",
  },
  {
    title: "How It Works",
    content: "Posts are generated automatically each day.",
  },
  {
    title: "Next Steps",
    content: "Hook up the AI service to add fresh content.",
  },
];

async function main() {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM articles"
    );
    if (rows[0].count > 0) {
      console.log("Seed skipped: articles already present");
      return;
    }

    for (const row of seedRows) {
      await pool.query(
        "INSERT INTO articles (title, content) VALUES ($1, $2)",
        [row.title, row.content]
      );
    }
    console.log("Seed complete");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();