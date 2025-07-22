import Foundation
import SwiftUI

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: UserWithProfile?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let networkManager: NetworkManager
    private let keychain = KeychainManager()
    
    init() {
        self.networkManager = NetworkManager()
        
        // Check for existing token on init
        if let token = UserDefaults.standard.string(forKey: "auth_token") {
            self.isAuthenticated = true
            // Load user data in background
            Task {
                await loadCurrentUser()
            }
        }
    }
    
    // MARK: - Authentication Methods
    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await networkManager.login(email: email, password: password)
            
            // Store token
            UserDefaults.standard.set(response.user.id, forKey: "auth_token")
            
            // Update state
            self.user = response.user
            self.isAuthenticated = true
            
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func register(email: String, username: String, password: String, firstName: String?, lastName: String?) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await networkManager.register(
                email: email,
                username: username,
                password: password,
                firstName: firstName,
                lastName: lastName
            )
            
            // Store token
            UserDefaults.standard.set(response.user.id, forKey: "auth_token")
            
            // Update state
            self.user = response.user
            self.isAuthenticated = true
            
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func logout() async {
        isLoading = true
        
        do {
            try await networkManager.logout()
        } catch {
            // Log error but continue with logout
            print("Logout error: \(error)")
        }
        
        // Clear local storage
        UserDefaults.standard.removeObject(forKey: "auth_token")
        keychain.delete(key: "biometric_credentials")
        
        // Update state
        self.user = nil
        self.isAuthenticated = false
        self.errorMessage = nil
        
        isLoading = false
    }
    
    func validateStoredToken() async {
        guard UserDefaults.standard.string(forKey: "auth_token") != nil else {
            return
        }
        
        do {
            let user = try await networkManager.getCurrentUser()
            self.user = user
            self.isAuthenticated = true
        } catch {
            // Token is invalid, clear it
            UserDefaults.standard.removeObject(forKey: "auth_token")
            self.isAuthenticated = false
            self.user = nil
        }
    }
    
    private func loadCurrentUser() async {
        do {
            let user = try await networkManager.getCurrentUser()
            self.user = user
        } catch {
            // If we can't load user data, might be an invalid token
            UserDefaults.standard.removeObject(forKey: "auth_token")
            self.isAuthenticated = false
            self.user = nil
        }
    }
    
    // MARK: - Onboarding
    func completeOnboarding(
        gender: String?,
        birthday: Date?,
        height: String?,
        weight: String?,
        bodyType: String?,
        goals: [String]
    ) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await networkManager.completeOnboarding(
                gender: gender,
                birthday: birthday,
                height: height,
                weight: weight,
                bodyType: bodyType,
                goals: goals
            )
            
            // Update user data
            self.user = response.user
            
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    // MARK: - Error Handling
    func clearError() {
        errorMessage = nil
    }
}

// MARK: - Keychain Manager
class KeychainManager {
    private let service = "com.company.FitnessTracker"
    
    func save(key: String, data: Data) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        // Delete any existing item
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        SecItemAdd(query as CFDictionary, nil)
    }
    
    func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            return nil
        }
        
        return result as? Data
    }
    
    func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Biometric Credentials
struct BiometricCredentials: Codable {
    let email: String
    let password: String
}