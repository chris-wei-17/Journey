import Foundation
import SwiftUI

@MainActor
class NetworkManager: ObservableObject {
    private let baseURL: String
    private let session: URLSession
    private let jsonDecoder: JSONDecoder
    private let jsonEncoder: JSONEncoder
    
    init() {
        // Configure your backend URL here
        // For development, you might use ngrok or your local IP
        self.baseURL = "https://your-backend-url.com" // Replace with your actual backend URL
        
        // Configure URLSession
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
        
        // Configure JSON decoder/encoder
        self.jsonDecoder = JSONDecoder()
        self.jsonEncoder = JSONEncoder()
        
        // Configure date formatting
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        self.jsonDecoder.dateDecodingStrategy = .formatted(dateFormatter)
        self.jsonEncoder.dateEncodingStrategy = .formatted(dateFormatter)
    }
    
    // MARK: - Generic Request Method
    private func makeRequest<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Data? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header if required
        if requiresAuth {
            if let token = UserDefaults.standard.string(forKey: "auth_token") {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200...299:
                return try jsonDecoder.decode(T.self, from: data)
            case 401:
                throw NetworkError.unauthorized
            case 400...499:
                // Try to decode error message
                if let apiError = try? jsonDecoder.decode(APIError.self, from: data) {
                    throw NetworkError.apiError(apiError.message)
                }
                throw NetworkError.clientError(httpResponse.statusCode)
            case 500...599:
                throw NetworkError.serverError(httpResponse.statusCode)
            default:
                throw NetworkError.unknownError(httpResponse.statusCode)
            }
        } catch let error as NetworkError {
            throw error
        } catch {
            throw NetworkError.networkError(error)
        }
    }
    
    // MARK: - Authentication Methods
    func login(email: String, password: String) async throws -> AuthResponse {
        let loginRequest = LoginRequest(email: email, password: password)
        let body = try jsonEncoder.encode(loginRequest)
        
        let response: AuthResponse = try await makeRequest(
            endpoint: "/api/auth/login",
            method: .POST,
            body: body,
            requiresAuth: false
        )
        
        return response
    }
    
    func register(email: String, username: String, password: String, firstName: String?, lastName: String?) async throws -> AuthResponse {
        let registerRequest = RegisterRequest(
            email: email,
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
        let body = try jsonEncoder.encode(registerRequest)
        
        let response: AuthResponse = try await makeRequest(
            endpoint: "/api/auth/register",
            method: .POST,
            body: body,
            requiresAuth: false
        )
        
        return response
    }
    
    func getCurrentUser() async throws -> UserWithProfile {
        return try await makeRequest(endpoint: "/api/user")
    }
    
    func logout() async throws {
        let _: [String: String] = try await makeRequest(
            endpoint: "/api/auth/logout",
            method: .POST
        )
    }
    
    // MARK: - Onboarding Methods
    func completeOnboarding(
        gender: String?,
        birthday: Date?,
        height: String?,
        weight: String?,
        bodyType: String?,
        goals: [String]
    ) async throws -> AuthResponse {
        let onboardingRequest = OnboardingRequest(
            gender: gender,
            birthday: birthday,
            height: height,
            weight: weight,
            bodyType: bodyType,
            goals: goals
        )
        let body = try jsonEncoder.encode(onboardingRequest)
        
        return try await makeRequest(
            endpoint: "/api/onboarding",
            method: .POST,
            body: body
        )
    }
    
    // MARK: - Progress Methods
    func getProgress() async throws -> [ProgressEntry] {
        return try await makeRequest(endpoint: "/api/progress")
    }
    
    func getProgressForDate(_ date: Date) async throws -> [ProgressEntry] {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: date)
        return try await makeRequest(endpoint: "/api/progress/date/\(dateString)")
    }
    
    func addProgress(goalType: String, progressValue: Int, entryDate: Date? = nil) async throws -> ProgressEntry {
        let progressRequest = ProgressRequest(
            goalType: goalType,
            progressValue: progressValue,
            entryDate: entryDate
        )
        let body = try jsonEncoder.encode(progressRequest)
        
        return try await makeRequest(
            endpoint: "/api/progress",
            method: .POST,
            body: body
        )
    }
    
    // MARK: - Photo Methods
    func getPhotos() async throws -> [Photo] {
        return try await makeRequest(endpoint: "/api/photos")
    }
    
    func uploadPhoto(_ imageData: Data, date: Date) async throws -> Photo {
        guard let url = URL(string: baseURL + "/api/photos") else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Add authorization header
        if let token = UserDefaults.standard.string(forKey: "auth_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Create multipart form data
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        let dateString = dateFormatter.string(from: date)
        
        var body = Data()
        
        // Add photo data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"photos\"; filename=\"photo.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add date field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"date\"\r\n\r\n".data(using: .utf8)!)
        body.append(dateString.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.invalidResponse
            }
            
            guard httpResponse.statusCode == 200 else {
                throw NetworkError.serverError(httpResponse.statusCode)
            }
            
            return try jsonDecoder.decode(Photo.self, from: data)
        } catch {
            throw NetworkError.networkError(error)
        }
    }
    
    // MARK: - Activity Methods
    func getActivities() async throws -> [Activity] {
        return try await makeRequest(endpoint: "/api/activities")
    }
    
    func addActivity(
        name: String,
        description: String? = nil,
        category: String? = nil,
        duration: Int? = nil,
        calories: Int? = nil,
        date: Date? = nil
    ) async throws -> Activity {
        let activityRequest = ActivityRequest(
            name: name,
            description: description,
            category: category,
            duration: duration,
            calories: calories,
            date: date
        )
        let body = try jsonEncoder.encode(activityRequest)
        
        return try await makeRequest(
            endpoint: "/api/activities",
            method: .POST,
            body: body
        )
    }
    
    // MARK: - Macro Methods
    func getMacros() async throws -> [MacroEntry] {
        return try await makeRequest(endpoint: "/api/macros")
    }
    
    func getMacroTargets() async throws -> [MacroTarget] {
        return try await makeRequest(endpoint: "/api/macro-targets")
    }
    
    func addMacro(
        foodName: String,
        calories: Int,
        protein: Double? = nil,
        carbs: Double? = nil,
        fat: Double? = nil,
        mealType: String? = nil,
        date: Date? = nil
    ) async throws -> MacroEntry {
        let macroRequest = MacroRequest(
            foodName: foodName,
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            date: date,
            mealType: mealType
        )
        let body = try jsonEncoder.encode(macroRequest)
        
        return try await makeRequest(
            endpoint: "/api/macros",
            method: .POST,
            body: body
        )
    }
    
    // MARK: - Metrics Methods
    func getMetrics() async throws -> [MetricEntry] {
        return try await makeRequest(endpoint: "/api/metrics")
    }
    
    func addMetric(
        metricType: String,
        value: Double,
        unit: String? = nil,
        date: Date? = nil
    ) async throws -> MetricEntry {
        let metricRequest = MetricRequest(
            metricType: metricType,
            value: value,
            unit: unit,
            date: date
        )
        let body = try jsonEncoder.encode(metricRequest)
        
        return try await makeRequest(
            endpoint: "/api/metrics",
            method: .POST,
            body: body
        )
    }
}

// MARK: - HTTP Method Enum
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
    case PATCH = "PATCH"
}

// MARK: - Network Error Enum
enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case clientError(Int)
    case serverError(Int)
    case unknownError(Int)
    case networkError(Error)
    case apiError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response"
        case .unauthorized:
            return "Unauthorized access"
        case .clientError(let code):
            return "Client error: \(code)"
        case .serverError(let code):
            return "Server error: \(code)"
        case .unknownError(let code):
            return "Unknown error: \(code)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .apiError(let message):
            return message
        }
    }
}