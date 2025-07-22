import LocalAuthentication
import Foundation
import SwiftUI

@MainActor
class BiometricManager: ObservableObject {
    @Published var isBiometricAvailable = false
    @Published var biometricType: BiometricType = .none
    @Published var errorMessage: String?
    
    private let context = LAContext()
    private let keychain = KeychainManager()
    
    init() {
        checkBiometricAvailability()
    }
    
    // MARK: - Biometric Availability
    func checkBiometricAvailability() {
        var error: NSError?
        
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            isBiometricAvailable = true
            
            switch context.biometryType {
            case .faceID:
                biometricType = .faceID
            case .touchID:
                biometricType = .touchID
            case .opticID:
                biometricType = .opticID
            default:
                biometricType = .none
                isBiometricAvailable = false
            }
        } else {
            isBiometricAvailable = false
            biometricType = .none
            
            if let error = error {
                print("Biometric authentication not available: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - Authentication Methods
    func authenticateWithBiometrics(completion: @escaping (Bool) -> Void) async {
        let reason = "Use \(biometricType.rawValue) to access your fitness data securely"
        
        do {
            let result = try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
            await MainActor.run {
                completion(result)
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                completion(false)
            }
        }
    }
    
    func enableBiometricLogin(email: String, password: String) async -> Bool {
        guard isBiometricAvailable else {
            errorMessage = "Biometric authentication is not available on this device"
            return false
        }
        
        let reason = "Enable \(biometricType.rawValue) to securely store your login credentials"
        
        do {
            let result = try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
            
            if result {
                // Store credentials securely
                let credentials = BiometricCredentials(email: email, password: password)
                if let data = try? JSONEncoder().encode(credentials) {
                    keychain.save(key: "biometric_credentials", data: data)
                    return true
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        
        return false
    }
    
    func disableBiometricLogin() {
        keychain.delete(key: "biometric_credentials")
    }
    
    // MARK: - Credential Management
    func hasBiometricCredentials() -> Bool {
        return keychain.load(key: "biometric_credentials") != nil
    }
    
    func getStoredCredentials() -> BiometricCredentials? {
        guard let data = keychain.load(key: "biometric_credentials") else {
            return nil
        }
        
        return try? JSONDecoder().decode(BiometricCredentials.self, from: data)
    }
    
    // MARK: - Error Handling
    func clearError() {
        errorMessage = nil
    }
}

// MARK: - Biometric Type Enum
enum BiometricType: String {
    case none = "None"
    case touchID = "Touch ID"
    case faceID = "Face ID"
    case opticID = "Optic ID"
    
    var systemImageName: String {
        switch self {
        case .touchID:
            return "touchid"
        case .faceID:
            return "faceid"
        case .opticID:
            return "opticid"
        case .none:
            return "lock"
        }
    }
}

// MARK: - Biometric Error Handling
extension BiometricManager {
    func handleBiometricError(_ error: Error) -> String {
        guard let laError = error as? LAError else {
            return error.localizedDescription
        }
        
        switch laError.code {
        case .authenticationFailed:
            return "Authentication failed. Please try again."
        case .userCancel:
            return "Authentication was cancelled."
        case .userFallback:
            return "User chose to use password instead."
        case .biometryNotAvailable:
            return "\(biometricType.rawValue) is not available on this device."
        case .biometryNotEnrolled:
            return "\(biometricType.rawValue) is not set up on this device."
        case .biometryLockout:
            return "\(biometricType.rawValue) is locked. Please use your passcode to unlock."
        default:
            return "An error occurred during authentication."
        }
    }
}