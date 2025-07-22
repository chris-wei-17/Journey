# Configuration Guide

## Backend URL Configuration

To connect your iOS app to your backend, you need to update the `NetworkManager.swift` file:

### 1. For Local Development
```swift
// In NetworkManager.swift, line ~13
self.baseURL = "http://localhost:5000" // Your local backend port
```

### 2. For Production/Deployed Backend
```swift
// In NetworkManager.swift, line ~13
self.baseURL = "https://your-domain.com" // Your deployed backend URL
```

### 3. For ngrok (Development with External Access)
If you're using ngrok to expose your local backend:
```swift
// In NetworkManager.swift, line ~13
self.baseURL = "https://your-ngrok-url.ngrok.io"
```

## Required Backend Endpoints

Ensure your backend supports these endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/user` - Get current user info

### Onboarding
- `POST /api/onboarding` - Complete user onboarding

### Progress
- `GET /api/progress` - Get today's progress
- `GET /api/progress/date/{date}` - Get progress for specific date
- `POST /api/progress` - Add progress entry

### Photos
- `GET /api/photos` - Get user photos
- `POST /api/photos` - Upload photos (multipart/form-data)

### Activities
- `GET /api/activities` - Get user activities
- `POST /api/activities` - Add new activity

### Macros/Nutrition
- `GET /api/macros` - Get macro entries
- `POST /api/macros` - Add macro entry
- `GET /api/macro-targets` - Get macro targets

### Metrics
- `GET /api/metrics` - Get metric entries
- `POST /api/metrics` - Add metric entry

## CORS Configuration

Make sure your backend allows requests from iOS app:

```javascript
// Example for Express.js
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true
}));
```

## Testing the Connection

1. Build and run the iOS app in simulator
2. Try to register a new account
3. Check Xcode console for network errors
4. Verify API calls are reaching your backend

## Common Issues

### 1. Connection Refused
- Check that backend is running
- Verify the URL and port are correct
- For localhost, use actual IP address instead of `localhost` when testing on device

### 2. CORS Errors
- Update your backend CORS configuration
- Allow the iOS app's requests

### 3. SSL/TLS Issues
- For HTTPS endpoints, ensure valid SSL certificate
- For development, you may need to configure App Transport Security

### 4. Authentication Issues
- Verify JWT token format matches backend expectations
- Check token expiration handling

## App Transport Security (ATS)

If you need to connect to HTTP (non-HTTPS) endpoints during development, add this to `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

**Warning**: Only use this for development. Production apps should use HTTPS.

## Environment-Specific Configuration

For different environments (dev, staging, prod), you can:

1. Create build configurations in Xcode
2. Use compiler flags to switch URLs
3. Or create a simple config file:

```swift
// Config.swift
struct Config {
    #if DEBUG
    static let baseURL = "http://localhost:5000"
    #else
    static let baseURL = "https://your-production-url.com"
    #endif
}
```