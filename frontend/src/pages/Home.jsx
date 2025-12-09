import { useEffect, useState } from "react";
import { fetchArticles, fetchArticle } from "../api/client";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchArticles()
      .then((data) => setArticles(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openArticle = async (id) => {
    setError("");
    try {
      const article = await fetchArticle(id);
      setSelected(article);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 animate-pulse">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md border border-red-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-2">
            Symetric Blog
          </h1>
          <p className="text-gray-600 text-lg">
            Explore our latest AI-generated articles
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Articles List */}
          <aside className="md:col-span-1 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Articles ({articles.length})
            </h2>
            <div className="space-y-3">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] border border-gray-200 ${
                    selected?.id === article.id ? "ring-2 ring-indigo-500 shadow-lg" : ""
                  }`}
                  onClick={() => openArticle(article.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-500">
                      {new Date(article.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </aside>

          {/* Article Detail */}
          <section className="md:col-span-2">
            {selected ? (
              <Card className="h-full border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold mb-2">{selected.title}</CardTitle>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(selected.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700 leading-7">
                      {selected.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center border border-gray-200 shadow-lg">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Select an article to read
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}