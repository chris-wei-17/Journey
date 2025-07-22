import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var showingBiometricLogin = false
    @State private var isInitializing = true
    
    var body: some View {
        Group {
            if isInitializing {
                // Splash screen
                ZStack {
                    LinearGradient(
                        gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .ignoresSafeArea()
                    
                    VStack(spacing: 20) {
                        Image(systemName: "figure.strengthtraining.traditional")
                            .font(.system(size: 80))
                            .foregroundColor(.white)
                        
                        Text("FitnessTracker")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(1.5)
                    }
                }
            } else if authManager.isAuthenticated {
                if authManager.user?.onboardingCompleted == true {
                    TabBarView()
                } else {
                    OnboardingView()
                }
            } else {
                if showingBiometricLogin && biometricManager.isBiometricAvailable {
                    BiometricLoginView()
                } else {
                    AuthView()
                }
            }
        }
        .onAppear {
            initializeApp()
        }
        .onChange(of: authManager.isAuthenticated) { isAuthenticated in
            if isAuthenticated {
                showingBiometricLogin = false
            }
        }
    }
    
    private func initializeApp() {
        Task {
            // Simulate app initialization time
            try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
            
            // Check for stored biometric credentials
            if biometricManager.isBiometricAvailable && biometricManager.hasBiometricCredentials() {
                await MainActor.run {
                    showingBiometricLogin = true
                    isInitializing = false
                }
            } else {
                // Try to authenticate with stored token
                await authManager.validateStoredToken()
                await MainActor.run {
                    isInitializing = false
                }
            }
        }
    }
}

struct BiometricLoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var showingManualLogin = false
    
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 40) {
                Image(systemName: "faceid")
                    .font(.system(size: 80))
                    .foregroundColor(.white)
                
                Text("Welcome Back!")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Use \(biometricManager.biometricType.rawValue) to securely access your fitness data")
                    .font(.body)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                
                Button(action: authenticateWithBiometrics) {
                    HStack {
                        Image(systemName: biometricManager.biometricType == .faceID ? "faceid" : "touchid")
                        Text("Authenticate with \(biometricManager.biometricType.rawValue)")
                    }
                    .font(.headline)
                    .foregroundColor(.blue)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(10)
                }
                
                Button("Use Email & Password Instead") {
                    showingManualLogin = true
                }
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.8))
            }
        }
        .onAppear {
            // Auto-trigger biometric authentication
            authenticateWithBiometrics()
        }
        .fullScreenCover(isPresented: $showingManualLogin) {
            AuthView()
        }
    }
    
    private func authenticateWithBiometrics() {
        Task {
            await biometricManager.authenticateWithBiometrics { success in
                if success {
                    // Get stored credentials and login
                    if let credentials = biometricManager.getStoredCredentials() {
                        Task {
                            await authManager.login(email: credentials.email, password: credentials.password)
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
        .environmentObject(NetworkManager())
        .environmentObject(BiometricManager())
}