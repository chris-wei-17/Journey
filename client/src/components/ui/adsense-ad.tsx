import { useEffect, useRef } from 'react';

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  adStyle?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdSenseAd({ 
  adSlot, 
  adFormat = 'auto',
  adStyle = { display: 'block' },
  className = '',
  responsive = true
}: AdSenseAdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // Check if AdSense script is loaded
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        // Push the ad to AdSense queue
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Don't render ads in development mode to avoid issues
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}>
        <div className="text-gray-500 text-sm">
          <i className="fas fa-ad text-2xl mb-2 block"></i>
          AdSense Ad Placeholder
          <div className="text-xs mt-1">Slot: {adSlot}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={process.env.VITE_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Blog-specific ad component with predefined styling
export function BlogAdBanner({ className = '' }: { className?: string }) {
  return (
    <AdSenseAd
      adSlot={process.env.VITE_ADSENSE_BLOG_SLOT || "1234567890"}
      adFormat="horizontal"
      className={`my-6 ${className}`}
      adStyle={{
        display: 'block',
        textAlign: 'center',
        minHeight: '280px',
      }}
    />
  );
}

// Responsive display ad for between posts
export function BlogDisplayAd({ className = '', adKey }: { className?: string; adKey?: string }) {
  return (
    <AdSenseAd
      adSlot={process.env.VITE_ADSENSE_DISPLAY_SLOT || "0987654321"}
      adFormat="auto"
      className={`my-8 ${className}`}
      adStyle={{
        display: 'block',
        minHeight: '200px',
      }}
      responsive={true}
    />
  );
}

// Function to determine if an ad should be placed at a given position
export function shouldShowAdAtIndex(index: number, totalPosts: number): boolean {
  // Show ad after every post except the last one
  // This automatically scales as more posts are added
  return index < totalPosts - 1;
}

// Function to get ad placement strategy based on number of posts
export function getAdPlacementStrategy(totalPosts: number) {
  if (totalPosts <= 1) {
    return { showBetweenPosts: false, showFinalAd: false };
  } else if (totalPosts <= 3) {
    return { showBetweenPosts: true, showFinalAd: false };
  } else {
    return { showBetweenPosts: true, showFinalAd: true };
  }
}

// Enhanced blog list component with automatic ad placement
export function BlogListWithAds({ 
  posts, 
  onPostClick, 
  className = '' 
}: { 
  posts: any[];
  onPostClick: (filename: string) => void;
  className?: string;
}) {
  const strategy = getAdPlacementStrategy(posts.length);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map((post, index) => (
        <div key={`post-${index}`}>
          {/* Blog Post Card */}
          <div 
            className="bg-white/75 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 rounded-lg p-6"
            onClick={() => onPostClick(post.filename)}
          >
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight">
                {post.title}
              </h3>
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
          </div>
          
          {/* Ad placement - automatically scales with more posts */}
          {strategy.showBetweenPosts && shouldShowAdAtIndex(index, posts.length) && (
            <BlogDisplayAd 
              key={`ad-${index}`}
              adKey={`between-${index}`}
              className="rounded-lg overflow-hidden bg-white/75 backdrop-blur-sm border-0 shadow-lg" 
            />
          )}
        </div>
      ))}
      
      {/* Final ad at bottom for longer lists */}
      {strategy.showFinalAd && (
        <BlogDisplayAd 
          key="final-ad"
          adKey="final"
          className="rounded-lg overflow-hidden bg-white/75 backdrop-blur-sm border-0 shadow-lg mt-8" 
        />
      )}
    </div>
  );
}