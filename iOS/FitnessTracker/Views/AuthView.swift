import SwiftUI

struct AuthView: View {
    @State private var isLoginMode = true
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // App Logo and Title
                VStack(spacing: 15) {
                    Image(systemName: "figure.strengthtraining.traditional")
                        .font(.system(size: 60))
                        .foregroundColor(.white)
                    
                    Text("FitnessTracker")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text("Track your fitness journey")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.top, 50)
                
                Spacer()
                
                // Auth Forms
                VStack(spacing: 20) {
                    // Mode Toggle
                    HStack(spacing: 0) {
                        Button("Login") {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                isLoginMode = true
                            }
                        }
                        .foregroundColor(isLoginMode ? .blue : .white.opacity(0.7))
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(isLoginMode ? Color.white : Color.clear)
                        .cornerRadius(25, corners: [.topLeft, .bottomLeft])
                        
                        Button("Register") {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                isLoginMode = false
                            }
                        }
                        .foregroundColor(!isLoginMode ? .blue : .white.opacity(0.7))
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(!isLoginMode ? Color.white : Color.clear)
                        .cornerRadius(25, corners: [.topRight, .bottomRight])
                    }
                    .background(Color.white.opacity(0.2))
                    .cornerRadius(25)
                    .padding(.horizontal, 40)
                    
                    // Auth Form
                    if isLoginMode {
                        LoginView()
                    } else {
                        RegisterView()
                    }
                }
                
                Spacer()
            }
        }
    }
}

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var email = ""
    @State private var password = ""
    @State private var showBiometricPrompt = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Login Form
            VStack(spacing: 15) {
                CustomTextField(
                    placeholder: "Email",
                    text: $email,
                    icon: "envelope"
                )
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                
                CustomSecureField(
                    placeholder: "Password",
                    text: $password,
                    icon: "lock"
                )
            }
            .padding(.horizontal, 40)
            
            // Error Message
            if let errorMessage = authManager.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            // Login Button
            Button(action: login) {
                HStack {
                    if authManager.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                            .scaleEffect(0.8)
                    } else {
                        Text("Login")
                            .font(.headline)
                    }
                }
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white)
                .cornerRadius(25)
            }
            .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
            .padding(.horizontal, 40)
            
            // Biometric Login Option
            if biometricManager.isBiometricAvailable && !biometricManager.hasBiometricCredentials() {
                Button("Enable \(biometricManager.biometricType.rawValue) Login") {
                    showBiometricPrompt = true
                }
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.8))
            }
        }
        .alert("Enable Biometric Login", isPresented: $showBiometricPrompt) {
            Button("Enable") {
                enableBiometricLogin()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Would you like to enable \(biometricManager.biometricType.rawValue) for secure and convenient login?")
        }
    }
    
    private func login() {
        Task {
            await authManager.login(email: email, password: password)
        }
    }
    
    private func enableBiometricLogin() {
        guard !email.isEmpty && !password.isEmpty else {
            authManager.errorMessage = "Please enter your credentials first"
            return
        }
        
        Task {
            let success = await biometricManager.enableBiometricLogin(email: email, password: password)
            if success {
                // Login with credentials
                await authManager.login(email: email, password: password)
            }
        }
    }
}

struct RegisterView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var username = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    
    var body: some View {
        VStack(spacing: 20) {
            // Registration Form
            VStack(spacing: 15) {
                CustomTextField(
                    placeholder: "Email",
                    text: $email,
                    icon: "envelope"
                )
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                
                CustomTextField(
                    placeholder: "Username",
                    text: $username,
                    icon: "person"
                )
                .autocapitalization(.none)
                
                HStack(spacing: 10) {
                    CustomTextField(
                        placeholder: "First Name",
                        text: $firstName,
                        icon: nil
                    )
                    
                    CustomTextField(
                        placeholder: "Last Name",
                        text: $lastName,
                        icon: nil
                    )
                }
                
                CustomSecureField(
                    placeholder: "Password",
                    text: $password,
                    icon: "lock"
                )
                
                CustomSecureField(
                    placeholder: "Confirm Password",
                    text: $confirmPassword,
                    icon: "lock"
                )
            }
            .padding(.horizontal, 40)
            
            // Error Message
            if let errorMessage = authManager.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            // Password validation
            if !password.isEmpty {
                VStack(alignment: .leading, spacing: 5) {
                    HStack {
                        Image(systemName: password.count >= 8 ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(password.count >= 8 ? .green : .red)
                        Text("At least 8 characters")
                            .font(.caption)
                    }
                    
                    if !confirmPassword.isEmpty {
                        HStack {
                            Image(systemName: password == confirmPassword ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundColor(password == confirmPassword ? .green : .red)
                            Text("Passwords match")
                                .font(.caption)
                        }
                    }
                }
                .foregroundColor(.white)
                .padding(.horizontal, 40)
            }
            
            // Register Button
            Button(action: register) {
                HStack {
                    if authManager.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                            .scaleEffect(0.8)
                    } else {
                        Text("Create Account")
                            .font(.headline)
                    }
                }
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white)
                .cornerRadius(25)
            }
            .disabled(authManager.isLoading || !isFormValid)
            .padding(.horizontal, 40)
        }
    }
    
    private var isFormValid: Bool {
        return !email.isEmpty &&
               !username.isEmpty &&
               !password.isEmpty &&
               password.count >= 8 &&
               password == confirmPassword
    }
    
    private func register() {
        Task {
            await authManager.register(
                email: email,
                username: username,
                password: password,
                firstName: firstName.isEmpty ? nil : firstName,
                lastName: lastName.isEmpty ? nil : lastName
            )
        }
    }
}

// MARK: - Custom UI Components
struct CustomTextField: View {
    let placeholder: String
    @Binding var text: String
    let icon: String?
    
    var body: some View {
        HStack {
            if let icon = icon {
                Image(systemName: icon)
                    .foregroundColor(.gray)
                    .frame(width: 20)
            }
            
            TextField(placeholder, text: $text)
                .textFieldStyle(PlainTextFieldStyle())
        }
        .padding()
        .background(Color.white.opacity(0.9))
        .cornerRadius(10)
    }
}

struct CustomSecureField: View {
    let placeholder: String
    @Binding var text: String
    let icon: String?
    @State private var isSecure = true
    
    var body: some View {
        HStack {
            if let icon = icon {
                Image(systemName: icon)
                    .foregroundColor(.gray)
                    .frame(width: 20)
            }
            
            if isSecure {
                SecureField(placeholder, text: $text)
                    .textFieldStyle(PlainTextFieldStyle())
            } else {
                TextField(placeholder, text: $text)
                    .textFieldStyle(PlainTextFieldStyle())
            }
            
            Button(action: { isSecure.toggle() }) {
                Image(systemName: isSecure ? "eye.slash" : "eye")
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color.white.opacity(0.9))
        .cornerRadius(10)
    }
}

// MARK: - View Extensions
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthManager())
        .environmentObject(BiometricManager())
}