import SwiftUI

struct MetricsView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 60))
                    .foregroundColor(.orange)
                
                Text("Metrics")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Track your fitness metrics and see your progress over time")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Button("Add Metric") {
                    // Handle add metric
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .background(Color.orange)
                .cornerRadius(10)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Metrics")
        }
    }
}

#Preview {
    MetricsView()
}