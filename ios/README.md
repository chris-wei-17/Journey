# Journey iOS (Native SwiftUI)

This is a native iOS SwiftUI app that talks to the existing server used by the PWA.

## Requirements
- macOS with Xcode 15+
- XcodeGen (optional) if you want to regenerate the project
  - Install: brew install xcodegen

## Project Structure
- project.yml — XcodeGen spec
- Journey/Info.plist — app Info.plist (includes API_BASE_URL)
- Journey/Resources/Assets.xcassets — asset catalog (add AppIcon later)
- Journey/Resources/Base.lproj/LaunchScreen.storyboard — minimal launch screen
- Journey/Sources — Swift sources
  - App.swift — SwiftUI entry point
  - Features/Home/HomeView.swift — sample screen
  - Networking/APIClient.swift — simple client that fetches /api/health

## Configure API Base URL
Info.plist contains API_BASE_URL which defaults to http://localhost:5000.
Change it to your deployed server URL (e.g. https://your-domain.com).

## Generate Xcode Project (optional)
If you have XcodeGen installed:
```
cd ios
xcodegen generate
open Journey.xcodeproj
```

Alternatively, you can add this folder to a new Xcode project manually if preferred.

## Run
1. Open the generated Xcode project
2. Set your signing team in the target settings
3. Select a simulator or device
4. Build & Run

The Home screen fetches and displays /api/health from your server.

## App Icon
Add your icons to Journey/Resources/Assets.xcassets/AppIcon.appiconset then set ASSETCATALOG_COMPILER_APPICON_NAME to AppIcon in project.yml if you prefer XcodeGen to enforce it.
