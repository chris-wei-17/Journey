import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { BlogPost, loadBlogPosts } from "@/lib/blog-utils";
import { useAuth } from "@/hooks/useAuth";

export default function BlogPostView() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        // Get the filename from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const filename = urlParams.get('post');
        
        if (!filename) {
          setError('No blog post specified');
          setLoading(false);
          return;
        }

        // Load all blog posts and find the one we want
        const posts = await loadBlogPosts();
        const post = posts.find(p => p.filename === filename);
        
        if (!post) {
          setError('Blog post not found');
          setLoading(false);
          return;
        }

        setBlogPost(post);
      } catch (error) {
        console.error("Error loading blog post:", error);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, []);

  const handleBack = () => {
    if (isAuthenticated) {
      setLocation("/landing");
    } else {
      setLocation("/");
    }
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: JSX.Element[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        elements.push(<h1 key={index} className="text-2xl font-bold text-gray-800 mb-4 mt-6">{line.substring(2)}</h1>);
        return;
      }
      if (line.startsWith('## ')) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        elements.push(<h2 key={index} className="text-xl font-bold text-gray-800 mb-3 mt-5">{line.substring(3)}</h2>);
        return;
      }
      if (line.startsWith('### ')) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        elements.push(<h3 key={index} className="text-lg font-bold text-gray-800 mb-2 mt-4">{line.substring(4)}</h3>);
        return;
      }
      
      // Lists
      if (line.startsWith('- ')) {
        if (!inList) {
          inList = true;
        }
        currentList.push(<li key={index} className="text-gray-700">{line.substring(2)}</li>);
        return;
      }
      if (line.startsWith('1. ')) {
        if (!inList) {
          inList = true;
        }
        currentList.push(<li key={index} className="text-gray-700">{line.substring(3)}</li>);
        return;
      }
      
      // End of list
      if (inList && line.trim() === '') {
        if (currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        return;
      }
      
      // Bold text
      if (line.includes('**')) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        const parts = line.split('**');
        elements.push(
          <p key={index} className="text-gray-700 mb-3 leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
            )}
          </p>
        );
        return;
      }
      
      // Regular paragraphs
      if (line.trim()) {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        elements.push(<p key={index} className="text-gray-700 mb-3 leading-relaxed">{line}</p>);
        return;
      }
      
      // Empty lines
      if (line.trim() === '') {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        elements.push(<div key={index} className="mb-2"></div>);
      }
    });

    // Handle any remaining list items
    if (inList && currentList.length > 0) {
      elements.push(<ul key="final-list" className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
    }

    return elements;
  };

  if (loading) {
    return (
      <div className="app-gradient-bg">
        <Header 
          title="Loading..." 
          showBackButton={true}
          onBack={handleBack}
        />
        <main className="pt-[calc(env(safe-area-inset-top)+5rem)] p-4 max-w-2xl mx-auto">
          <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="app-gradient-bg">
        <Header 
          title="Error" 
          showBackButton={true}
          onBack={handleBack}
        />
        <main className="pt-[calc(env(safe-area-inset-top)+5rem)] p-4 max-w-2xl mx-auto">
          <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Blog Post Not Found</h2>
                <p className="text-gray-600 mb-4">{error || 'The requested blog post could not be loaded.'}</p>
                <button 
                  onClick={handleBack}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Back to Blog
                </button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="app-gradient-bg">
      <Header 
        title={blogPost.title} 
        showBackButton={true}
        onBack={handleBack}
      />
      
      <main className="pt-[calc(env(safe-area-inset-top)+5rem)] p-4 max-w-2xl mx-auto">
        <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-800 leading-tight">
                {blogPost.title}
              </CardTitle>
            </div>
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">
              {blogPost.filename.replace('.md', '')}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="prose prose-gray max-w-none">
              {renderMarkdown(blogPost.content)}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 