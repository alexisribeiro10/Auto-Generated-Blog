import axios from "axios";

const HUGGINGFACE_API_URL = "https://router.huggingface.co/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/Llama-3.1-8B-Instruct:novita";

/**
 * Generate article content using HuggingFace Router API
 * @param {string} topic - Optional topic for the article
 * @returns {Promise<{title: string, content: string}>}
 */
export async function generateArticle(topic = null) {
  try {
    const articleTopic = topic || generateRandomTopic();

    const prompt = `Write a blog article about "${articleTopic}". 
The article should be informative, well-structured, and approximately 300-500 words. 
Include an engaging title and comprehensive content.
Format: First line should be the title, followed by the article content.`;

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY is required in .env");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    console.log(`Calling HuggingFace Router API with model: ${DEFAULT_MODEL}`);

    const response = await axios.post(
      HUGGINGFACE_API_URL,
      {
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      },
      { headers, timeout: 60000 }
    );

    return parseResponse(response.data, articleTopic);
  } catch (error) {
    console.error("=== AI Generation Error ===");
    console.error("Error message:", error.message);
    console.error("Response status:", error.response?.status);
    console.error(
      "Response data:",
      JSON.stringify(error.response?.data, null, 2)
    );

    throw new Error(
      `AI API failed: ${error.message}. Please check your API key and model.`
    );
  }
}

/**
 * Parse the Router API response
 */
function parseResponse(data, articleTopic) {
  const generatedText = data?.choices?.[0]?.message?.content;

  if (!generatedText) {
    throw new Error("No content generated");
  }

  // Split into lines and filter empty lines
  const lines = generatedText.split("\n").filter((line) => line.trim());

  // Remove Markdown syntax
  const cleanedLines = lines.map(
    (line) =>
      line
        .replace(/^\s*[*_#]+\s*/, "") // remove headings or bold/italic at start
        .replace(/[*_]{1,2}/g, "") // remove remaining bold/italic
  );

  const title = cleanedLines[0]?.trim() || articleTopic;
  const content = cleanedLines.slice(1).join("\n\n").trim();

  console.log("✅ Successfully generated article via AI API");

  return {
    title: title.length > 255 ? title.substring(0, 255) : title,
    content,
  };
}

/**
 * Generate a random topic for articles
 */
function generateRandomTopic() {
  const topics = [
    "Artificial Intelligence",
    "Web Development",
    "Cloud Computing",
    "Data Science",
    "Cybersecurity",
    "Mobile Development",
    "DevOps Practices",
    "Software Architecture",
    "Machine Learning",
    "Blockchain Technology",
    "Internet of Things",
    "Quantum Computing",
    "User Experience Design",
    "Agile Methodologies",
    "Database Management",
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}