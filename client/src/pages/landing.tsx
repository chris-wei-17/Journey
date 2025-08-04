import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";
import { useState, useEffect } from "react";
import { loadBlogPosts, BlogPost } from "@/lib/blog-utils";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const posts = await loadBlogPosts();
        setBlogPosts(posts);
      } catch (error) {
        console.error("Error loading blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const handleBack = () => {
    if (isAuthenticated) {
      setLocation("/");
    } else {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        setLocation("/");
      }
    }
  };

  const handleBlogPostClick = (filename: string) => {
    setLocation(`/blog-post?post=${encodeURIComponent(filename)}`);
  };

  return (
    <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-2xl mx-auto">
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
        <Header 
          title="JOURNEY BLOG" 
          showBackButton={isAuthenticated}
          onBack={handleBack}
        />
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Latest Articles</h2>
          <p className="text-white/80 text-sm">Insights on fitness, nutrition, and wellness</p>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/75 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((post, index) => (
              <Card 
                key={index} 
                className="bg-white/75 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleBlogPostClick(post.filename)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight">
                      {post.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        {post.filename.replace('.md', '')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Read more →
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Quick Access - Keep this at the bottom */}
        <QuickAccess />
      </div>
    </main>
  );
}
