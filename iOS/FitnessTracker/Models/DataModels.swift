import Foundation

// MARK: - User Models
struct User: Codable, Identifiable {
    let id: Int
    let email: String
    let username: String
    let firstName: String?
    let lastName: String?
    let profileImageUrl: String?
    let isEmailVerified: Bool
    let createdAt: Date
    let updatedAt: Date
    let onboardingCompleted: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id, email, username
        case firstName = "first_name"
        case lastName = "last_name"
        case profileImageUrl = "profile_image_url"
        case isEmailVerified = "is_email_verified"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case onboardingCompleted = "onboarding_completed"
    }
}

struct UserProfile: Codable, Identifiable {
    let id: Int
    let userId: Int
    let gender: String?
    let birthday: Date?
    let height: String?
    let weight: String?
    let bodyType: String?
    let onboardingCompleted: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case gender, birthday, height, weight
        case bodyType = "body_type"
        case onboardingCompleted = "onboarding_completed"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct UserWithProfile: Codable, Identifiable {
    let id: Int
    let email: String
    let username: String
    let firstName: String?
    let lastName: String?
    let profileImageUrl: String?
    let isEmailVerified: Bool
    let createdAt: Date
    let updatedAt: Date
    let onboardingCompleted: Bool?
    let profile: UserProfile?
    
    enum CodingKeys: String, CodingKey {
        case id, email, username
        case firstName = "first_name"
        case lastName = "last_name"
        case profileImageUrl = "profile_image_url"
        case isEmailVerified = "is_email_verified"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case onboardingCompleted = "onboarding_completed"
        case profile
    }
}

// MARK: - Auth Models
struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let username: String
    let password: String
    let firstName: String?
    let lastName: String?
    
    enum CodingKeys: String, CodingKey {
        case email, username, password
        case firstName = "first_name"
        case lastName = "last_name"
    }
}

struct AuthResponse: Codable {
    let message: String
    let user: UserWithProfile
}

// MARK: - Goal Models
struct UserGoal: Codable, Identifiable {
    let id: Int
    let userId: Int
    let goalType: String
    let isActive: Bool
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case goalType = "goal_type"
        case isActive = "is_active"
        case createdAt = "created_at"
    }
}

struct OnboardingRequest: Codable {
    let gender: String?
    let birthday: Date?
    let height: String?
    let weight: String?
    let bodyType: String?
    let goals: [String]
    
    enum CodingKeys: String, CodingKey {
        case gender, birthday, height, weight
        case bodyType = "body_type"
        case goals
    }
}

// MARK: - Progress Models
struct ProgressEntry: Codable, Identifiable {
    let id: Int
    let userId: Int
    let goalType: String
    let progressValue: Int
    let entryDate: Date
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case goalType = "goal_type"
        case progressValue = "progress_value"
        case entryDate = "entry_date"
        case createdAt = "created_at"
    }
}

struct ProgressRequest: Codable {
    let goalType: String
    let progressValue: Int
    let entryDate: Date?
    
    enum CodingKeys: String, CodingKey {
        case goalType = "goal_type"
        case progressValue = "progress_value"
        case entryDate = "entry_date"
    }
}

// MARK: - Photo Models
struct Photo: Codable, Identifiable {
    let id: Int
    let userId: Int
    let filename: String
    let originalName: String
    let thumbnailFilename: String?
    let mimeType: String
    let size: Int
    let date: Date
    let uploadDate: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case filename
        case originalName = "original_name"
        case thumbnailFilename = "thumbnail_filename"
        case mimeType = "mime_type"
        case size, date
        case uploadDate = "upload_date"
    }
}

// MARK: - Activity Models
struct Activity: Codable, Identifiable {
    let id: Int
    let userId: Int
    let name: String
    let description: String?
    let category: String?
    let duration: Int?
    let calories: Int?
    let date: Date
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name, description, category, duration, calories, date
        case createdAt = "created_at"
    }
}

struct ActivityRequest: Codable {
    let name: String
    let description: String?
    let category: String?
    let duration: Int?
    let calories: Int?
    let date: Date?
}

// MARK: - Macro Models
struct MacroEntry: Codable, Identifiable {
    let id: Int
    let userId: Int
    let foodName: String
    let calories: Int
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let date: Date
    let mealType: String?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case foodName = "food_name"
        case calories, protein, carbs, fat, date
        case mealType = "meal_type"
        case createdAt = "created_at"
    }
}

struct MacroRequest: Codable {
    let foodName: String
    let calories: Int
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let date: Date?
    let mealType: String?
    
    enum CodingKeys: String, CodingKey {
        case foodName = "food_name"
        case calories, protein, carbs, fat, date
        case mealType = "meal_type"
    }
}

struct MacroTarget: Codable, Identifiable {
    let id: Int
    let userId: Int
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let isActive: Bool
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case calories, protein, carbs, fat
        case isActive = "is_active"
        case createdAt = "created_at"
    }
}

// MARK: - Metrics Models
struct MetricEntry: Codable, Identifiable {
    let id: Int
    let userId: Int
    let metricType: String
    let value: Double
    let unit: String?
    let date: Date
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case metricType = "metric_type"
        case value, unit, date
        case createdAt = "created_at"
    }
}

struct MetricRequest: Codable {
    let metricType: String
    let value: Double
    let unit: String?
    let date: Date?
    
    enum CodingKeys: String, CodingKey {
        case metricType = "metric_type"
        case value, unit, date
    }
}

// MARK: - Custom Types
enum GoalType: String, CaseIterable {
    case generalFitness = "general-fitness"
    case cardio = "cardio"
    case strength = "strength"
    case muscleMass = "muscle-mass"
    case weightLoss = "weight-loss"
    case improveDiet = "improve-diet"
    
    var displayName: String {
        switch self {
        case .generalFitness: return "General Fitness"
        case .cardio: return "Cardio"
        case .strength: return "Strength"
        case .muscleMass: return "Muscle Mass"
        case .weightLoss: return "Weight Loss"
        case .improveDiet: return "Improve Diet"
        }
    }
    
    var icon: String {
        switch self {
        case .generalFitness: return "figure.walk"
        case .cardio: return "heart.fill"
        case .strength: return "dumbbell.fill"
        case .muscleMass: return "figure.strengthtraining.traditional"
        case .weightLoss: return "scalemass.fill"
        case .improveDiet: return "leaf.fill"
        }
    }
}

enum BodyType: String, CaseIterable {
    case ectomorph = "ectomorph"
    case mesomorph = "mesomorph"
    case endomorph = "endomorph"
    
    var displayName: String {
        switch self {
        case .ectomorph: return "Ectomorph (Lean)"
        case .mesomorph: return "Mesomorph (Athletic)"
        case .endomorph: return "Endomorph (Stocky)"
        }
    }
}

enum MealType: String, CaseIterable {
    case breakfast = "breakfast"
    case lunch = "lunch"
    case dinner = "dinner"
    case snack = "snack"
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var icon: String {
        switch self {
        case .breakfast: return "sun.rise"
        case .lunch: return "sun.max"
        case .dinner: return "moon"
        case .snack: return "bite"
        }
    }
}

// MARK: - Error Models
struct APIError: Codable {
    let message: String
}

// MARK: - Response Wrappers
struct APIResponse<T: Codable>: Codable {
    let data: T?
    let message: String?
    let error: String?
}