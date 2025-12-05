const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export async function fetchArticles() {
  const res = await fetch(`${API_URL}/articles`);
  if (!res.ok) throw new Error("Failed to load articles");
  return res.json();
}

export async function fetchArticle(id) {
  const res = await fetch(`${API_URL}/articles/${id}`);
  if (!res.ok) throw new Error("Failed to load article");
  return res.json();
}