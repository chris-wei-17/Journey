import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var currentStep = 0
    @State private var gender = ""
    @State private var birthday = Date()
    @State private var height = ""
    @State private var weight = ""
    @State private var bodyType = ""
    @State private var selectedGoals: Set<String> = []
    @State private var isCompleting = false
    
    private let steps = [
        "Personal Info",
        "Body Metrics",
        "Fitness Goals"
    ]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Progress Header
                progressHeader
                
                // Content
                TabView(selection: $currentStep) {
                    personalInfoStep.tag(0)
                    bodyMetricsStep.tag(1)
                    fitnessGoalsStep.tag(2)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                
                // Navigation Controls
                navigationControls
            }
            .navigationBarHidden(true)
        }
    }
    
    private var progressHeader: some View {
        VStack(spacing: 20) {
            // Progress Bar
            HStack {
                ForEach(0..<steps.count, id: \.self) { index in
                    Rectangle()
                        .fill(index <= currentStep ? Color.blue : Color.gray.opacity(0.3))
                        .frame(height: 4)
                        .animation(.easeInOut, value: currentStep)
                    
                    if index < steps.count - 1 {
                        Spacer()
                    }
                }
            }
            .padding(.horizontal)
            
            // Step Title
            Text(steps[currentStep])
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Step \(currentStep + 1) of \(steps.count)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private var personalInfoStep: some View {
        ScrollView {
            VStack(spacing: 25) {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                
                Text("Tell us about yourself")
                    .font(.headline)
                    .multilineTextAlignment(.center)
                
                VStack(spacing: 20) {
                    // Gender Selection
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Gender (Optional)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        HStack(spacing: 15) {
                            ForEach(["Male", "Female", "Other"], id: \.self) { option in
                                Button(action: { gender = option }) {
                                    Text(option)
                                        .font(.subheadline)
                                        .foregroundColor(gender == option ? .white : .blue)
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 10)
                                        .background(gender == option ? Color.blue : Color.blue.opacity(0.1))
                                        .cornerRadius(20)
                                }
                            }
                        }
                    }
                    
                    // Birthday Selection
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Birthday (Optional)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        DatePicker(
                            "Birthday",
                            selection: $birthday,
                            in: ...Date(),
                            displayedComponents: .date
                        )
                        .datePickerStyle(WheelDatePickerStyle())
                        .labelsHidden()
                    }
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding()
        }
    }
    
    private var bodyMetricsStep: some View {
        ScrollView {
            VStack(spacing: 25) {
                Image(systemName: "figure.stand.line.dotted.figure.stand")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                
                Text("Your body metrics")
                    .font(.headline)
                    .multilineTextAlignment(.center)
                
                Text("This helps us provide personalized recommendations")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                
                VStack(spacing: 20) {
                    // Height
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Height (Optional)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        TextField("e.g., 5'8\" or 173cm", text: $height)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    // Weight
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Weight (Optional)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        TextField("e.g., 150lbs or 68kg", text: $weight)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    // Body Type
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Body Type (Optional)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        VStack(spacing: 10) {
                            ForEach(BodyType.allCases, id: \.self) { type in
                                Button(action: { bodyType = type.rawValue }) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 5) {
                                            Text(type.displayName)
                                                .font(.subheadline)
                                                .fontWeight(.medium)
                                            
                                            Text(bodyTypeDescription(for: type))
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        
                                        Spacer()
                                        
                                        if bodyType == type.rawValue {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.blue)
                                        } else {
                                            Image(systemName: "circle")
                                                .foregroundColor(.gray)
                                        }
                                    }
                                    .padding()
                                    .background(bodyType == type.rawValue ? Color.blue.opacity(0.1) : Color(.systemGray6))
                                    .cornerRadius(10)
                                }
                                .foregroundColor(.primary)
                            }
                        }
                    }
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding()
        }
    }
    
    private var fitnessGoalsStep: some View {
        ScrollView {
            VStack(spacing: 25) {
                Image(systemName: "target")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                
                Text("What are your fitness goals?")
                    .font(.headline)
                    .multilineTextAlignment(.center)
                
                Text("Select all that apply to personalize your experience")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                
                VStack(spacing: 15) {
                    ForEach(GoalType.allCases, id: \.self) { goal in
                        Button(action: { toggleGoal(goal.rawValue) }) {
                            HStack {
                                Image(systemName: goal.icon)
                                    .foregroundColor(.blue)
                                    .frame(width: 30)
                                
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(goal.displayName)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                    
                                    Text(goalDescription(for: goal))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                if selectedGoals.contains(goal.rawValue) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.blue)
                                } else {
                                    Image(systemName: "circle")
                                        .foregroundColor(.gray)
                                }
                            }
                            .padding()
                            .background(selectedGoals.contains(goal.rawValue) ? Color.blue.opacity(0.1) : Color(.systemGray6))
                            .cornerRadius(10)
                        }
                        .foregroundColor(.primary)
                    }
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding()
        }
    }
    
    private var navigationControls: some View {
        HStack {
            if currentStep > 0 {
                Button("Previous") {
                    withAnimation {
                        currentStep -= 1
                    }
                }
                .font(.headline)
                .foregroundColor(.blue)
            }
            
            Spacer()
            
            if currentStep < steps.count - 1 {
                Button("Next") {
                    withAnimation {
                        currentStep += 1
                    }
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 30)
                .padding(.vertical, 15)
                .background(Color.blue)
                .cornerRadius(25)
            } else {
                Button(action: completeOnboarding) {
                    HStack {
                        if isCompleting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Text("Complete Setup")
                                .font(.headline)
                        }
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 30)
                    .padding(.vertical, 15)
                    .background(selectedGoals.isEmpty ? Color.gray : Color.blue)
                    .cornerRadius(25)
                }
                .disabled(selectedGoals.isEmpty || isCompleting)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    // MARK: - Helper Methods
    private func bodyTypeDescription(for type: BodyType) -> String {
        switch type {
        case .ectomorph:
            return "Naturally thin, fast metabolism"
        case .mesomorph:
            return "Athletic build, gains muscle easily"
        case .endomorph:
            return "Broader build, slower metabolism"
        }
    }
    
    private func goalDescription(for goal: GoalType) -> String {
        switch goal {
        case .generalFitness:
            return "Overall health and wellness"
        case .cardio:
            return "Improve cardiovascular endurance"
        case .strength:
            return "Build muscle strength and power"
        case .muscleMass:
            return "Increase muscle size and mass"
        case .weightLoss:
            return "Lose weight and body fat"
        case .improveDiet:
            return "Better nutrition and eating habits"
        }
    }
    
    private func toggleGoal(_ goal: String) {
        if selectedGoals.contains(goal) {
            selectedGoals.remove(goal)
        } else {
            selectedGoals.insert(goal)
        }
    }
    
    private func completeOnboarding() {
        isCompleting = true
        
        Task {
            await authManager.completeOnboarding(
                gender: gender.isEmpty ? nil : gender.lowercased(),
                birthday: birthday < Date() ? birthday : nil,
                height: height.isEmpty ? nil : height,
                weight: weight.isEmpty ? nil : weight,
                bodyType: bodyType.isEmpty ? nil : bodyType,
                goals: Array(selectedGoals)
            )
            
            await MainActor.run {
                isCompleting = false
            }
        }
    }
}

#Preview {
    OnboardingView()
        .environmentObject(AuthManager())
}