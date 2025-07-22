import SwiftUI

struct TabBarView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
                .tag(0)
            
            AddActivityView()
                .tabItem {
                    Image(systemName: "plus.circle.fill")
                    Text("Add")
                }
                .tag(1)
            
            MetricsView()
                .tabItem {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                    Text("Metrics")
                }
                .tag(2)
            
            PhotosView()
                .tabItem {
                    Image(systemName: "photo.fill")
                    Text("Photos")
                }
                .tag(3)
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
                .tag(4)
        }
        .accentColor(.blue)
    }
}

#Preview {
    TabBarView()
        .environmentObject(AuthManager())
        .environmentObject(NetworkManager())
        .environmentObject(BiometricManager())
}