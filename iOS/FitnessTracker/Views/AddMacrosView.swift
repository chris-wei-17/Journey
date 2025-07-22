import SwiftUI

struct AddMacrosView: View {
    @EnvironmentObject var networkManager: NetworkManager
    @State private var foodName = ""
    @State private var calories = ""
    @State private var protein = ""
    @State private var carbs = ""
    @State private var fat = ""
    @State private var selectedMealType = MealType.breakfast
    @State private var selectedDate = Date()
    @State private var isLoading = false
    @State private var showingSuccessAlert = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Header
                VStack(spacing: 15) {
                    Image(systemName: "leaf.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.green)
                    
                    Text("Log Your Meal")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("Track your nutrition and macros")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                // Form
                VStack(spacing: 20) {
                    // Food Name
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Food Name *")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        TextField("e.g., Grilled Chicken Breast", text: $foodName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    // Meal Type
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Meal Type")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        HStack(spacing: 10) {
                            ForEach(MealType.allCases, id: \.self) { mealType in
                                Button(action: { selectedMealType = mealType }) {
                                    VStack(spacing: 5) {
                                        Image(systemName: mealType.icon)
                                            .font(.title3)
                                        Text(mealType.displayName)
                                            .font(.caption)
                                    }
                                    .foregroundColor(selectedMealType == mealType ? .white : .green)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(selectedMealType == mealType ? Color.green : Color.green.opacity(0.1))
                                    .cornerRadius(10)
                                }
                            }
                        }
                    }
                    
                    // Macros
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Nutrition Information")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        // Calories (required)
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Calories *")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            TextField("200", text: $calories)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.numberPad)
                        }
                        
                        // Macros (optional)
                        HStack(spacing: 15) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Protein (g)")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                TextField("25", text: $protein)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .keyboardType(.decimalPad)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Carbs (g)")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                TextField("10", text: $carbs)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .keyboardType(.decimalPad)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Fat (g)")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                TextField("5", text: $fat)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .keyboardType(.decimalPad)
                            }
                        }
                    }
                    
                    // Date
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        DatePicker("Meal Date", selection: $selectedDate, displayedComponents: .date)
                            .datePickerStyle(CompactDatePickerStyle())
                    }
                }
                .padding(.horizontal)
                
                // Submit Button
                Button(action: submitMacro) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "plus.circle.fill")
                            Text("Log Meal")
                        }
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.green : Color.gray)
                    .cornerRadius(15)
                }
                .disabled(!isFormValid || isLoading)
                .padding(.horizontal)
                
                Spacer(minLength: 100)
            }
            .padding()
        }
        .alert("Success!", isPresented: $showingSuccessAlert) {
            Button("OK") { }
        } message: {
            Text("Your meal has been logged successfully!")
        }
    }
    
    private var isFormValid: Bool {
        !foodName.isEmpty && !calories.isEmpty
    }
    
    private func submitMacro() {
        isLoading = true
        
        Task {
            do {
                _ = try await networkManager.addMacro(
                    foodName: foodName,
                    calories: Int(calories) ?? 0,
                    protein: protein.isEmpty ? nil : Double(protein),
                    carbs: carbs.isEmpty ? nil : Double(carbs),
                    fat: fat.isEmpty ? nil : Double(fat),
                    mealType: selectedMealType.rawValue,
                    date: selectedDate
                )
                
                await MainActor.run {
                    // Reset form
                    foodName = ""
                    calories = ""
                    protein = ""
                    carbs = ""
                    fat = ""
                    selectedDate = Date()
                    
                    showingSuccessAlert = true
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    print("Error adding macro: \(error)")
                }
            }
        }
    }
}

#Preview {
    AddMacrosView()
        .environmentObject(NetworkManager())
}