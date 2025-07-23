# Client-Side Photo URL Handling Guide

This guide explains how to handle photo URL expiration gracefully in your client application.

## 🔄 **How Signed URLs Work**

- **Expiry Time**: 1 hour from generation
- **Server Caching**: URLs are cached on server with 10-minute refresh buffer
- **User Experience**: Seamless access without re-login

## 📱 **Client Implementation Strategies**

### **Strategy 1: Automatic Refresh on Error (Recommended)**

```javascript
// React Hook for photo loading with automatic retry
import { useState, useEffect } from 'react';

const usePhotoWithRetry = (initialUrl, photoId) => {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshUrl = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/photos/refresh-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ filePaths: [photoId] })
      });
      
      if (response.ok) {
        const { urls } = await response.json();
        const newUrl = urls[photoId];
        if (newUrl) {
          setImageUrl(newUrl);
          setError(null);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    // Automatically retry with fresh URL
    refreshUrl();
  };

  return { imageUrl, isLoading, error, handleImageError, refreshUrl };
};

// Usage in component
const PhotoComponent = ({ photo }) => {
  const { imageUrl, isLoading, handleImageError } = usePhotoWithRetry(
    photo.thumbnailUrl, 
    photo.thumbnailPath
  );

  return (
    <div>
      {isLoading && <div>Refreshing image...</div>}
      <img 
        src={imageUrl} 
        onError={handleImageError}
        alt={photo.originalName}
      />
    </div>
  );
};
```

### **Strategy 2: Preemptive Refresh**

```javascript
// Refresh URLs before they expire
const PhotoManager = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      // Refresh URLs every 50 minutes (before 1-hour expiry)
      const filePaths = photos.flatMap(photo => [photo.imagePath, photo.thumbnailPath]);
      
      try {
        const response = await fetch('/api/photos/refresh-urls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ filePaths })
        });
        
        if (response.ok) {
          const { urls } = await response.json();
          
          // Update photos with new URLs
          setPhotos(prevPhotos => 
            prevPhotos.map(photo => ({
              ...photo,
              imageUrl: urls[photo.imagePath] || photo.imageUrl,
              thumbnailUrl: urls[photo.thumbnailPath] || photo.thumbnailUrl
            }))
          );
        }
      } catch (error) {
        console.error('Failed to refresh URLs:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [photos]);

  return (
    <div>
      {photos.map(photo => (
        <img key={photo.id} src={photo.thumbnailUrl} alt={photo.originalName} />
      ))}
    </div>
  );
};
```

### **Strategy 3: iOS/React Native Implementation**

```swift
// iOS Swift implementation
class PhotoURLManager {
    private var urlCache: [String: (url: String, expiresAt: Date)] = [:]
    
    func getPhotoURL(for path: String, completion: @escaping (String?) -> Void) {
        // Check cache first
        if let cached = urlCache[path], 
           cached.expiresAt > Date().addingTimeInterval(300) { // 5 min buffer
            completion(cached.url)
            return
        }
        
        // Refresh from server
        refreshURL(for: path) { [weak self] newUrl in
            if let url = newUrl {
                self?.urlCache[path] = (url: url, expiresAt: Date().addingTimeInterval(3600))
            }
            completion(newUrl)
        }
    }
    
    private func refreshURL(for path: String, completion: @escaping (String?) -> Void) {
        // Make API call to refresh-urls endpoint
        // Implementation depends on your networking layer
    }
}
```

## 🎯 **User Experience Best Practices**

### **Loading States**
```javascript
const PhotoWithLoading = ({ photo }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleImageError = async () => {
    setIsRefreshing(true);
    await refreshUrl();
    setIsRefreshing(false);
  };
  
  return (
    <div className="relative">
      <img src={photo.thumbnailUrl} onError={handleImageError} />
      {isRefreshing && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span>Refreshing...</span>
        </div>
      )}
    </div>
  );
};
```

### **Error Handling**
```javascript
const PhotoWithFallback = ({ photo }) => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleImageError = () => {
    if (retryCount < 2) { // Limit retries
      setRetryCount(prev => prev + 1);
      // Trigger refresh logic
    } else {
      setHasError(true);
    }
  };
  
  if (hasError) {
    return <div>Unable to load image</div>;
  }
  
  return <img src={photo.thumbnailUrl} onError={handleImageError} />;
};
```

## ⚡ **Performance Optimization**

### **Batch URL Refresh**
```javascript
// Refresh multiple URLs at once for better performance
const refreshPhotoUrls = async (photos) => {
  const filePaths = photos.flatMap(photo => [photo.imagePath, photo.thumbnailPath]);
  
  const response = await fetch('/api/photos/refresh-urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ filePaths })
  });
  
  return response.json();
};
```

### **Cache Management**
```javascript
// Client-side cache with expiration
class PhotoURLCache {
  constructor() {
    this.cache = new Map();
  }
  
  set(path, url, expiresIn = 3600000) { // 1 hour default
    this.cache.set(path, {
      url,
      expiresAt: Date.now() + expiresIn
    });
  }
  
  get(path) {
    const cached = this.cache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.url;
    }
    this.cache.delete(path);
    return null;
  }
}
```

## ✅ **Summary**

**What happens when URLs expire:**
- ✅ User stays logged in (JWT tokens are separate)
- ✅ Server automatically generates fresh URLs
- ✅ Client can gracefully handle and retry failed image loads
- ✅ Seamless user experience with proper implementation

**Best approach:**
1. Implement automatic retry on image load errors
2. Use server-side caching (already implemented)
3. Consider preemptive refresh for long-running sessions
4. Provide loading states for better UX

This approach ensures users never need to log out/in due to expired photo URLs!