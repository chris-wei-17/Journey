import SwiftUI

@main
struct JourneyApp: App {
    @StateObject private var apiClient = APIClient()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(apiClient)
        }
    }
}
