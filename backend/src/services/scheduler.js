import cron from "node-cron";
import { createGeneratedArticle } from "./articleGenerator.js";

/**
 * Schedule a daily article generation at 08:00 PM
 */
cron.schedule("15 20 * * *", async () => {
    console.log("🕑 Starting daily article generation...");

    try {
        const article = await createGeneratedArticle();
        console.log(`✅ Daily article generated: ${article.title}`);
        console.log(`📝 Article content: ${article.content}`);
    } catch (error) {
        console.error("❌ Error generating daily article:", error.message);
    }
});

console.log("📅 Article scheduler initialized. Daily generation scheduled at 08:00 PM");
console.log("Server current time:", new Date().toString());