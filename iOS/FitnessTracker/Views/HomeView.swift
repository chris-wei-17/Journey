import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var networkManager: NetworkManager
    @State private var selectedDate = Date()
    @State private var progressData: [ProgressEntry] = []
    @State private var photos: [Photo] = []
    @State private var macros: [MacroEntry] = []
    @State private var isLoading = false
    @State private var showingDatePicker = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    headerView
                    
                    // Date Navigation
                    dateNavigationView
                    
                    // Quick Actions
                    quickActionsView
                    
                    // Progress Summary
                    progressSummaryView
                    
                    // Macros Summary
                    macrosSummaryView
                    
                    // Recent Photos
                    recentPhotosView
                    
                    // Motivational Quote
                    motivationalQuoteView
                }
                .padding()
            }
            .navigationBarHidden(true)
            .refreshable {
                await loadData()
            }
        }
        .onAppear {
            Task {
                await loadData()
            }
        }
        .sheet(isPresented: $showingDatePicker) {
            DatePicker("Select Date", selection: $selectedDate, displayedComponents: .date)
                .datePickerStyle(GraphicalDatePickerStyle())
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
        .onChange(of: selectedDate) { _ in
            Task {
                await loadProgressData()
            }
        }
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Hello, \(authManager.user?.firstName ?? authManager.user?.username ?? "there")!")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(greeting)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            AsyncImage(url: URL(string: authManager.user?.profileImageUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 50, height: 50)
            .clipShape(Circle())
        }
    }
    
    private var dateNavigationView: some View {
        HStack {
            Button(action: { changeDate(-1) }) {
                Image(systemName: "chevron.left")
                    .foregroundColor(.blue)
            }
            
            Spacer()
            
            Button(action: { showingDatePicker = true }) {
                VStack {
                    Text(selectedDate, style: .date)
                        .font(.headline)
                    
                    if Calendar.current.isDateInToday(selectedDate) {
                        Text("Today")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
            }
            
            Spacer()
            
            Button(action: { changeDate(1) }) {
                Image(systemName: "chevron.right")
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private var quickActionsView: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Quick Actions")
                .font(.headline)
                .fontWeight(.semibold)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 15) {
                QuickActionCard(
                    title: "Add Activity",
                    icon: "figure.run",
                    color: .blue
                ) {
                    // Navigate to Add Activity
                }
                
                QuickActionCard(
                    title: "Log Meal",
                    icon: "fork.knife",
                    color: .green
                ) {
                    // Navigate to Add Macros
                }
                
                QuickActionCard(
                    title: "Take Photo",
                    icon: "camera.fill",
                    color: .purple
                ) {
                    // Navigate to Camera
                }
                
                QuickActionCard(
                    title: "Add Metrics",
                    icon: "chart.line.uptrend.xyaxis",
                    color: .orange
                ) {
                    // Navigate to Metrics
                }
            }
        }
    }
    
    private var progressSummaryView: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Today's Progress")
                .font(.headline)
                .fontWeight(.semibold)
            
            if progressData.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "chart.bar.doc.horizontal")
                        .font(.title)
                        .foregroundColor(.gray)
                    
                    Text("No progress logged for this day")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text("Start tracking your fitness journey!")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 15) {
                    ForEach(progressData) { progress in
                        ProgressCard(progress: progress)
                    }
                }
            }
        }
    }
    
    private var macrosSummaryView: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Nutrition Summary")
                .font(.headline)
                .fontWeight(.semibold)
            
            if macros.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "leaf")
                        .font(.title)
                        .foregroundColor(.gray)
                    
                    Text("No meals logged today")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Button("Log Your First Meal") {
                        // Navigate to Add Macros
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            } else {
                MacroSummaryCard(macros: macros)
            }
        }
    }
    
    private var recentPhotosView: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Text("Recent Photos")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                if !photos.isEmpty {
                    Button("View All") {
                        // Navigate to Photos
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
            }
            
            if photos.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "camera")
                        .font(.title)
                        .foregroundColor(.gray)
                    
                    Text("No progress photos yet")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Button("Take Your First Photo") {
                        // Navigate to Camera
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(photos.prefix(5)) { photo in
                            AsyncImage(url: URL(string: photo.filename)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Rectangle()
                                    .fill(Color(.systemGray5))
                            }
                            .frame(width: 80, height: 80)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
    
    private var motivationalQuoteView: some View {
        VStack(spacing: 10) {
            Image(systemName: "quote.bubble")
                .font(.title2)
                .foregroundColor(.blue)
            
            Text(motivationalQuote)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .italic()
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(10)
    }
    
    // MARK: - Helper Methods
    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12:
            return "Good morning! Ready to conquer your goals?"
        case 12..<17:
            return "Good afternoon! Keep up the great work!"
        default:
            return "Good evening! Time to reflect on your progress!"
        }
    }
    
    private var motivationalQuote: String {
        let quotes = [
            "Every step counts! Keep pushing forward.",
            "You're stronger than yesterday.",
            "Progress, not perfection.",
            "Your only competition is who you were yesterday.",
            "Believe in yourself and keep going!",
            "The journey of a thousand miles begins with a single step.",
            "Success is the sum of small efforts repeated day in and day out."
        ]
        return quotes.randomElement() ?? quotes.first!
    }
    
    private func changeDate(_ days: Int) {
        if let newDate = Calendar.current.date(byAdding: .day, value: days, to: selectedDate) {
            selectedDate = newDate
        }
    }
    
    private func loadData() async {
        isLoading = true
        
        async let progressTask = loadProgressData()
        async let photosTask = loadPhotos()
        async let macrosTask = loadMacros()
        
        await progressTask
        await photosTask
        await macrosTask
        
        isLoading = false
    }
    
    private func loadProgressData() async {
        do {
            if Calendar.current.isDateInToday(selectedDate) {
                progressData = try await networkManager.getProgress()
            } else {
                progressData = try await networkManager.getProgressForDate(selectedDate)
            }
        } catch {
            print("Error loading progress: \(error)")
        }
    }
    
    private func loadPhotos() async {
        do {
            photos = try await networkManager.getPhotos()
        } catch {
            print("Error loading photos: \(error)")
        }
    }
    
    private func loadMacros() async {
        do {
            macros = try await networkManager.getMacros()
        } catch {
            print("Error loading macros: \(error)")
        }
    }
}

// MARK: - Supporting Views
struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity, minHeight: 80)
            .background(Color(.systemGray6))
            .cornerRadius(10)
        }
    }
}

struct ProgressCard: View {
    let progress: ProgressEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: goalTypeIcon)
                    .foregroundColor(.blue)
                
                Spacer()
                
                Text("\(progress.progressValue)%")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
            }
            
            Text(progress.goalType.capitalized)
                .font(.subheadline)
                .fontWeight(.medium)
            
            ProgressView(value: Double(progress.progressValue), total: 100)
                .progressViewStyle(LinearProgressViewStyle(tint: .blue))
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private var goalTypeIcon: String {
        if let goalType = GoalType(rawValue: progress.goalType) {
            return goalType.icon
        }
        return "target"
    }
}

struct MacroSummaryCard: View {
    let macros: [MacroEntry]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Calories")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(totalCalories)")
                        .font(.headline)
                        .fontWeight(.bold)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Protein")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(totalProtein))g")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                
                VStack(alignment: .trailing) {
                    Text("Carbs")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(totalCarbs))g")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                
                VStack(alignment: .trailing) {
                    Text("Fat")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(totalFat))g")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private var totalCalories: Int {
        macros.reduce(0) { $0 + $1.calories }
    }
    
    private var totalProtein: Double {
        macros.reduce(0) { $0 + ($1.protein ?? 0) }
    }
    
    private var totalCarbs: Double {
        macros.reduce(0) { $0 + ($1.carbs ?? 0) }
    }
    
    private var totalFat: Double {
        macros.reduce(0) { $0 + ($1.fat ?? 0) }
    }
}

#Preview {
    HomeView()
        .environmentObject(AuthManager())
        .environmentObject(NetworkManager())
        .environmentObject(BiometricManager())
}