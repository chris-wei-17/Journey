import SwiftUI

struct AddActivityView: View {
    @EnvironmentObject var networkManager: NetworkManager
    @State private var selectedTab = 0
    @State private var showingSuccessAlert = false
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            VStack {
                // Tab Selector
                HStack(spacing: 0) {
                    Button("Activity") {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            selectedTab = 0
                        }
                    }
                    .foregroundColor(selectedTab == 0 ? .white : .blue)
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(selectedTab == 0 ? Color.blue : Color.clear)
                    .cornerRadius(25, corners: [.topLeft, .bottomLeft])
                    
                    Button("Macros") {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            selectedTab = 1
                        }
                    }
                    .foregroundColor(selectedTab == 1 ? .white : .blue)
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(selectedTab == 1 ? Color.blue : Color.clear)
                    .cornerRadius(25, corners: [.topRight, .bottomRight])
                }
                .background(Color.blue.opacity(0.1))
                .cornerRadius(25)
                .padding(.horizontal)
                
                // Content
                TabView(selection: $selectedTab) {
                    AddActivityFormView(isLoading: $isLoading, showingSuccessAlert: $showingSuccessAlert)
                        .tag(0)
                    
                    AddMacrosView()
                        .tag(1)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .navigationTitle("Add Entry")
            .navigationBarTitleDisplayMode(.inline)
        }
        .alert("Success!", isPresented: $showingSuccessAlert) {
            Button("OK") { }
        } message: {
            Text("Your activity has been logged successfully!")
        }
    }
}

struct AddActivityFormView: View {
    @EnvironmentObject var networkManager: NetworkManager
    @Binding var isLoading: Bool
    @Binding var showingSuccessAlert: Bool
    
    @State private var activityName = ""
    @State private var description = ""
    @State private var category = ""
    @State private var duration = ""
    @State private var calories = ""
    @State private var selectedDate = Date()
    
    private let categories = [
        "Cardio", "Strength", "Flexibility", "Sports", "Outdoor", "Other"
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Header
                VStack(spacing: 15) {
                    Image(systemName: "figure.run.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("Log Your Activity")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("Track your workouts and activities")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                // Form
                VStack(spacing: 20) {
                    // Activity Name
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Activity Name *")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        TextField("e.g., Morning Run, Gym Workout", text: $activityName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    // Category
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Category")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 10) {
                            ForEach(categories, id: \.self) { cat in
                                Button(action: { category = cat }) {
                                    Text(cat)
                                        .font(.caption)
                                        .fontWeight(.medium)
                                        .foregroundColor(category == cat ? .white : .blue)
                                        .padding(.horizontal, 15)
                                        .padding(.vertical, 8)
                                        .background(category == cat ? Color.blue : Color.blue.opacity(0.1))
                                        .cornerRadius(15)
                                }
                            }
                        }
                    }
                    
                    // Duration and Calories
                    HStack(spacing: 15) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Duration (min)")
                                .font(.headline)
                                .fontWeight(.medium)
                            
                            TextField("30", text: $duration)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.numberPad)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Calories")
                                .font(.headline)
                                .fontWeight(.medium)
                            
                            TextField("200", text: $calories)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.numberPad)
                        }
                    }
                    
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        TextField("Optional notes about your activity", text: $description, axis: .vertical)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .lineLimit(3...6)
                    }
                    
                    // Date
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date")
                            .font(.headline)
                            .fontWeight(.medium)
                        
                        DatePicker("Activity Date", selection: $selectedDate, displayedComponents: .date)
                            .datePickerStyle(CompactDatePickerStyle())
                    }
                }
                .padding(.horizontal)
                
                // Submit Button
                Button(action: submitActivity) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "plus.circle.fill")
                            Text("Log Activity")
                        }
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(activityName.isEmpty ? Color.gray : Color.blue)
                    .cornerRadius(15)
                }
                .disabled(activityName.isEmpty || isLoading)
                .padding(.horizontal)
                
                Spacer(minLength: 100)
            }
            .padding()
        }
    }
    
    private func submitActivity() {
        isLoading = true
        
        Task {
            do {
                _ = try await networkManager.addActivity(
                    name: activityName,
                    description: description.isEmpty ? nil : description,
                    category: category.isEmpty ? nil : category,
                    duration: Int(duration),
                    calories: Int(calories),
                    date: selectedDate
                )
                
                await MainActor.run {
                    // Reset form
                    activityName = ""
                    description = ""
                    category = ""
                    duration = ""
                    calories = ""
                    selectedDate = Date()
                    
                    showingSuccessAlert = true
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    // Handle error
                    print("Error adding activity: \(error)")
                }
            }
        }
    }
}

#Preview {
    AddActivityView()
        .environmentObject(NetworkManager())
}