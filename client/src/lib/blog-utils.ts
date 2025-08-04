export interface BlogPost {
  title: string;
  filename: string;
  content: string;
  excerpt?: string;
}

// List of known blog posts
const BLOG_POSTS = [
  {
    filename: 'wearables.md',
    title: 'How Wearable Tech is Revolutionizing Fitness and Recovery in 2025',
    excerpt: 'Wearables are no longer just step counters. In 2025, they\'ve become personalized wellness engines—tracking recovery, heart rate variability, sleep, and even stress.'
  },
  {
    filename: 'nutrition-trends.md',
    title: 'The Future of Personalized Nutrition: AI-Driven Meal Planning',
    excerpt: 'Personalized nutrition is revolutionizing how we approach health and wellness. With AI-powered algorithms analyzing our unique genetic makeup, lifestyle, and goals.'
  },
  {
    filename: 'sleep-optimization.md',
    title: 'Sleep Optimization: The Missing Link in Fitness Performance',
    excerpt: 'Sleep is the foundation of all health and fitness goals. Yet, it\'s often the most overlooked aspect of wellness. Understanding how to optimize your sleep.'
  }
];

export const loadBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const posts: BlogPost[] = [];
    
    for (const post of BLOG_POSTS) {
      try {
        // Try to fetch the markdown content
        const response = await fetch(`/blog-posts/${post.filename}`);
        if (response.ok) {
          const content = await response.text();
          posts.push({
            ...post,
            content
          });
        } else {
          // If fetch fails, still include the post with basic info
          posts.push({
            ...post,
            content: ''
          });
        }
      } catch (error) {
        console.warn(`Failed to load ${post.filename}:`, error);
        // Include the post even if content loading fails
        posts.push({
          ...post,
          content: ''
        });
      }
    }
    
    return posts;
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
};

export const extractTitleFromMarkdown = (content: string): string => {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return 'Untitled';
};

export const extractExcerptFromMarkdown = (content: string, maxLength: number = 150): string => {
  const lines = content.split('\n');
  let excerpt = '';
  
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && !line.startsWith('##')) {
      excerpt += line.trim() + ' ';
      if (excerpt.length > maxLength) {
        break;
      }
    }
  }
  
  return excerpt.trim().substring(0, maxLength) + (excerpt.length > maxLength ? '...' : '');
}; 