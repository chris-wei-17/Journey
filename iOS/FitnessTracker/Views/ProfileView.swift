import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var biometricManager: BiometricManager
    @State private var showingLogoutAlert = false
    @State private var showingBiometricAlert = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 25) {
                    // Profile Header
                    profileHeader
                    
                    // User Info Card
                    userInfoCard
                    
                    // Settings Section
                    settingsSection
                    
                    // Security Section
                    securitySection
                    
                    // Logout Button
                    logoutButton
                    
                    Spacer(minLength: 50)
                }
                .padding()
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
        .alert("Logout", isPresented: $showingLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Logout", role: .destructive) {
                Task {
                    await authManager.logout()
                }
            }
        } message: {
            Text("Are you sure you want to logout?")
        }
        .alert("Biometric Authentication", isPresented: $showingBiometricAlert) {
            if biometricManager.hasBiometricCredentials() {
                Button("Disable") {
                    biometricManager.disableBiometricLogin()
                }
                Button("Cancel", role: .cancel) { }
            } else {
                Button("Enable") {
                    // This would require re-entering credentials
                    // For now, just show info
                }
                Button("Cancel", role: .cancel) { }
            }
        } message: {
            if biometricManager.hasBiometricCredentials() {
                Text("Disable \(biometricManager.biometricType.rawValue) login for this account?")
            } else {
                Text("To enable \(biometricManager.biometricType.rawValue), please login again and select the biometric option.")
            }
        }
    }
    
    private var profileHeader: some View {
        VStack(spacing: 15) {
            // Profile Image
            AsyncImage(url: URL(string: authManager.user?.profileImageUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 100, height: 100)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(Color.blue, lineWidth: 3)
            )
            
            // User Name
            VStack(spacing: 5) {
                if let firstName = authManager.user?.firstName,
                   let lastName = authManager.user?.lastName {
                    Text("\(firstName) \(lastName)")
                        .font(.title2)
                        .fontWeight(.bold)
                } else {
                    Text(authManager.user?.username ?? "User")
                        .font(.title2)
                        .fontWeight(.bold)
                }
                
                Text(authManager.user?.email ?? "")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private var userInfoCard: some View {
        VStack(spacing: 15) {
            HStack {
                Text("Account Information")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
            }
            
            VStack(spacing: 12) {
                InfoRow(
                    icon: "envelope.fill",
                    title: "Email",
                    value: authManager.user?.email ?? "Not set"
                )
                
                InfoRow(
                    icon: "person.fill",
                    title: "Username",
                    value: authManager.user?.username ?? "Not set"
                )
                
                InfoRow(
                    icon: "calendar",
                    title: "Member Since",
                    value: formatDate(authManager.user?.createdAt)
                )
                
                if let profile = authManager.user?.profile {
                    if let height = profile.height {
                        InfoRow(
                            icon: "ruler",
                            title: "Height",
                            value: height
                        )
                    }
                    
                    if let weight = profile.weight {
                        InfoRow(
                            icon: "scalemass",
                            title: "Weight",
                            value: weight
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private var settingsSection: some View {
        VStack(spacing: 15) {
            HStack {
                Text("Settings")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
            }
            
            VStack(spacing: 0) {
                SettingsRow(
                    icon: "bell.fill",
                    title: "Notifications",
                    color: .orange
                ) {
                    // Handle notifications settings
                }
                
                Divider()
                    .padding(.leading, 50)
                
                SettingsRow(
                    icon: "gear",
                    title: "General Settings",
                    color: .gray
                ) {
                    // Handle general settings
                }
                
                Divider()
                    .padding(.leading, 50)
                
                SettingsRow(
                    icon: "questionmark.circle.fill",
                    title: "Help & Support",
                    color: .blue
                ) {
                    // Handle help
                }
            }
            .background(Color(.systemGray6))
            .cornerRadius(15)
        }
    }
    
    private var securitySection: some View {
        VStack(spacing: 15) {
            HStack {
                Text("Security")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
            }
            
            VStack(spacing: 0) {
                if biometricManager.isBiometricAvailable {
                    SettingsRow(
                        icon: biometricManager.biometricType.systemImageName,
                        title: "\(biometricManager.biometricType.rawValue) Login",
                        subtitle: biometricManager.hasBiometricCredentials() ? "Enabled" : "Disabled",
                        color: .green
                    ) {
                        showingBiometricAlert = true
                    }
                    
                    Divider()
                        .padding(.leading, 50)
                }
                
                SettingsRow(
                    icon: "key.fill",
                    title: "Change Password",
                    color: .purple
                ) {
                    // Handle password change
                }
                
                Divider()
                    .padding(.leading, 50)
                
                SettingsRow(
                    icon: "lock.fill",
                    title: "Privacy Settings",
                    color: .indigo
                ) {
                    // Handle privacy settings
                }
            }
            .background(Color(.systemGray6))
            .cornerRadius(15)
        }
    }
    
    private var logoutButton: some View {
        Button(action: { showingLogoutAlert = true }) {
            HStack {
                Image(systemName: "arrow.right.square.fill")
                Text("Logout")
            }
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red)
            .cornerRadius(15)
        }
    }
    
    // MARK: - Helper Methods
    private func formatDate(_ date: Date?) -> String {
        guard let date = date else { return "Unknown" }
        
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Views
struct InfoRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 25)
            
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String?
    let color: Color
    let action: () -> Void
    
    init(icon: String, title: String, subtitle: String? = nil, color: Color, action: @escaping () -> Void) {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.color = color
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 25)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthManager())
        .environmentObject(BiometricManager())
}