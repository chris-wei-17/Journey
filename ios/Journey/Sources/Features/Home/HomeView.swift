import SwiftUI

struct HomeView: View {
    @EnvironmentObject var apiClient: APIClient

    var body: some View {
        NavigationView {
            Group {
                if let health = apiClient.health {
                    List {
                        LabeledContent("Status", value: health.status)
                        LabeledContent("Timestamp", value: health.timestamp)
                        LabeledContent("Environment", value: health.environment)
                        LabeledContent("Vercel", value: String(health.vercel))
                    }
                } else if let error = apiClient.errorMessage {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                } else {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text("Loading…")
                    }
                }
            }
            .navigationTitle("Journey")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Refresh") { apiClient.fetchHealth() }
                }
            }
        }
    }
}

