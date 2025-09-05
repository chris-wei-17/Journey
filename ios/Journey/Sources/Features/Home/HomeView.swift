import SwiftUI

struct HomeView: View {
    @EnvironmentObject var apiClient: APIClient

    var body: some View {
        NavigationView {
            Group {
                if let health = apiClient.health {
                    List {
                        HStack {
                            Text("Status")
                            Spacer()
                            Text(health.status).foregroundColor(.secondary)
                        }
                        HStack {
                            Text("Timestamp")
                            Spacer()
                            Text(health.timestamp).foregroundColor(.secondary)
                        }
                        HStack {
                            Text("Environment")
                            Spacer()
                            Text(health.environment).foregroundColor(.secondary)
                        }
                        HStack {
                            Text("Vercel")
                            Spacer()
                            Text(String(health.vercel)).foregroundColor(.secondary)
                        }
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

