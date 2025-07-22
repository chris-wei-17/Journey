# FitnessTracker iOS App

A comprehensive iOS fitness tracking application built with SwiftUI that interfaces with your existing backend API. This app provides all the functionality of your web frontend with native iOS features including biometric authentication.

## Features

### 🔐 Authentication & Security
- **Email/Password Authentication** - Standard login and registration
- **Biometric Authentication** - Face ID/Touch ID support for secure, convenient access
- **Secure Token Management** - JWT tokens stored securely with automatic refresh
- **Keychain Integration** - Biometric credentials stored in iOS Keychain

### 🏠 Dashboard & Home
- **Personalized Dashboard** - Welcome messages based on time of day
- **Date Navigation** - View progress for any date with intuitive date picker
- **Quick Actions** - Fast access to log activities, meals, photos, and metrics
- **Progress Summary** - Visual progress cards for all fitness goals
- **Nutrition Overview** - Daily macro summary with calorie tracking
- **Recent Photos** - Horizontal scroll of latest progress photos
- **Motivational Quotes** - Daily inspiration to keep users motivated

### 👤 User Onboarding
- **Multi-step Setup** - Guided 3-step onboarding process
- **Personal Information** - Gender, birthday collection (optional)
- **Body Metrics** - Height, weight, body type selection
- **Fitness Goals** - Multiple goal selection with descriptions
- **Progress Tracking** - Visual progress indicators during setup

### 📊 Activity Tracking
- **Activity Logging** - Log workouts with name, category, duration, calories
- **Category Selection** - Cardio, Strength, Flexibility, Sports, Outdoor, Other
- **Date Selection** - Log activities for any date
- **Activity History** - View and manage past activities

### 🍎 Nutrition Tracking
- **Meal Logging** - Track food with macro breakdown
- **Meal Types** - Breakfast, Lunch, Dinner, Snack categorization
- **Macro Tracking** - Calories (required), Protein, Carbs, Fat (optional)
- **Daily Summaries** - Comprehensive nutrition overview

### 📷 Progress Photos
- **Camera Integration** - Take photos directly in-app
- **Photo Library** - Import existing photos
- **Progress Timeline** - Visual journey documentation
- **Secure Storage** - Photos uploaded to your backend

### 📈 Metrics & Analytics
- **Custom Metrics** - Track any fitness metric
- **Progress Visualization** - Charts and trends (placeholder for future implementation)
- **Goal Progress** - Visual progress bars for all goals

### ⚙️ Profile & Settings
- **User Profile** - Complete profile management
- **Account Information** - View and edit user details
- **Security Settings** - Manage biometric authentication
- **App Settings** - Notifications, privacy, help & support

## Technical Architecture

### 🛠 Technology Stack
- **SwiftUI** - Modern, declarative UI framework
- **iOS 16.0+** - Minimum deployment target
- **LocalAuthentication** - Face ID/Touch ID integration
- **URLSession** - HTTP networking with async/await
- **Keychain Services** - Secure credential storage
- **UIKit Integration** - Camera and photo picker functionality

### 🏗 App Architecture
- **MVVM Pattern** - Clean separation of concerns
- **ObservableObject** - Reactive state management
- **Environment Objects** - Dependency injection
- **Async/Await** - Modern concurrency handling

### 📱 iOS Best Practices
- **Native Navigation** - Tab bar and navigation controllers
- **Adaptive Layout** - Support for iPhone and iPad
- **Dark Mode Support** - System appearance integration
- **Accessibility** - VoiceOver and accessibility labels
- **Privacy Permissions** - Camera, photo library, Face ID permissions
- **Background Tasks** - Proper app lifecycle management

## Setup Instructions

### Prerequisites
- Xcode 15.0 or later
- iOS 16.0+ deployment target
- Active Apple Developer Account (for device testing)
- Running backend server

### Installation Steps

1. **Clone and Setup**
   ```bash
   cd iOS
   open FitnessTracker.xcodeproj
   ```

2. **Configure Backend URL**
   - Open `NetworkManager.swift`
   - Update the `baseURL` property with your backend URL:
   ```swift
   self.baseURL = "https://your-backend-url.com"
   ```

3. **Configure App Bundle**
   - Select the FitnessTracker project in Xcode
   - Update Bundle Identifier to your unique identifier
   - Configure Team and Signing Certificate

4. **Update Permissions (if needed)**
   - Modify `Info.plist` to customize permission descriptions
   - Current permissions include Camera, Photo Library, and Face ID

5. **Build and Run**
   - Select target device or simulator
   - Press Cmd+R to build and run

### Backend Integration

The app is designed to work with your existing backend API. Make sure your backend supports:

- **Authentication Endpoints**
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/logout`
  - `GET /api/user`

- **Onboarding Endpoint**
  - `POST /api/onboarding`

- **Progress Endpoints**
  - `GET /api/progress`
  - `GET /api/progress/date/{date}`
  - `POST /api/progress`

- **Photo Endpoints**
  - `GET /api/photos`
  - `POST /api/photos` (multipart/form-data)

- **Activity Endpoints**
  - `GET /api/activities`
  - `POST /api/activities`

- **Macro Endpoints**
  - `GET /api/macros`
  - `POST /api/macros`
  - `GET /api/macro-targets`

- **Metrics Endpoints**
  - `GET /api/metrics`
  - `POST /api/metrics`

## Development Notes

### 🔧 Customization Options

1. **Color Scheme**
   - Primary color: Blue
   - Secondary colors: Green (nutrition), Purple (photos), Orange (metrics)
   - Easily customizable in SwiftUI Color extensions

2. **Biometric Authentication**
   - Automatically detects available biometric type
   - Gracefully falls back to password authentication
   - Secure credential storage in Keychain

3. **Network Layer**
   - Generic request method for all API calls
   - Automatic error handling and token management
   - Support for multipart form data (photo uploads)

### 🚀 Optimization Suggestions

Based on iOS development best practices, here are some improvements over the basic requirements:

1. **Enhanced User Experience**
   - **Pull-to-refresh** on data views
   - **Haptic feedback** for user interactions
   - **Loading states** with progress indicators
   - **Error handling** with user-friendly messages

2. **Performance Optimizations**
   - **Image caching** for profile and progress photos
   - **Data pagination** for large datasets
   - **Background sync** when app becomes active
   - **Offline support** with local data storage

3. **Security Enhancements**
   - **Certificate pinning** for API security
   - **App Transport Security** configuration
   - **Biometric re-authentication** for sensitive actions
   - **Automatic logout** after inactivity

4. **Advanced Features**
   - **HealthKit integration** for automatic data sync
   - **Apple Watch companion** app
   - **Widgets** for home screen quick actions
   - **Shortcuts** integration for Siri commands

### 📝 Future Enhancements

1. **Charts and Analytics**
   - Implement proper charts using Swift Charts
   - Progress trends and statistics
   - Goal achievement insights

2. **Social Features**
   - Share progress with friends
   - Community challenges
   - Achievement badges

3. **Advanced Nutrition**
   - Barcode scanning for food items
   - Meal planning and recipes
   - Nutritional recommendations

4. **Workout Features**
   - Exercise library with instructions
   - Workout templates and programs
   - Timer and rest period tracking

## File Structure

```
iOS/FitnessTracker/
├── FitnessTrackerApp.swift          # App entry point
├── ContentView.swift                # Main content view with auth flow
├── Info.plist                       # App configuration and permissions
├── Models/
│   └── DataModels.swift            # All data models matching backend schema
├── Managers/
│   ├── NetworkManager.swift        # API communication layer
│   ├── AuthManager.swift          # Authentication state management
│   └── BiometricManager.swift     # Biometric authentication handling
├── Views/
│   ├── AuthView.swift             # Login and registration
│   ├── OnboardingView.swift       # User setup and goal selection
│   ├── TabBarView.swift           # Main tab navigation
│   ├── HomeView.swift             # Dashboard with progress overview
│   ├── AddActivityView.swift      # Activity logging form
│   ├── AddMacrosView.swift        # Nutrition logging form
│   ├── ProfileView.swift          # User profile and settings
│   ├── MetricsView.swift          # Metrics tracking (placeholder)
│   └── PhotosView.swift           # Progress photos with camera
└── Assets.xcassets/               # App icons and colors
```

## Support

For issues with the iOS app:

1. Check that your backend URL is correctly configured
2. Ensure all required API endpoints are implemented
3. Verify that CORS is properly configured for your domain
4. Check Xcode console for detailed error messages

The app is designed to be functionally identical to your browser-based frontend while providing enhanced mobile-specific features like biometric authentication, camera integration, and native iOS UI patterns.

## License

This iOS app follows the same license as your main project.