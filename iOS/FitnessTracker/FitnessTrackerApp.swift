import SwiftUI

@main
struct FitnessTrackerApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var networkManager = NetworkManager()
    @StateObject private var biometricManager = BiometricManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(networkManager)
                .environmentObject(biometricManager)
                .onAppear {
                    // Initialize biometric authentication if available
                    biometricManager.checkBiometricAvailability()
                }
        }
    }
}