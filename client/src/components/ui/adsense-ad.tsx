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
export function BlogDisplayAd({ className = '' }: { className?: string }) {
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