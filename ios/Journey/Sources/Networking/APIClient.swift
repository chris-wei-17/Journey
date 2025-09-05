import Foundation
import Combine

struct HealthResponse: Codable {
    let status: String
    let timestamp: String
    let environment: String
    let vercel: Bool
}

final class APIClient: ObservableObject {
    @Published var health: HealthResponse?
    @Published var errorMessage: String?

    private let session: URLSession
    private var cancellables = Set<AnyCancellable>()
    private let baseURL: URL

    init(session: URLSession = .shared) {
        self.session = session
        if let urlString = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
           let url = URL(string: urlString) {
            self.baseURL = url
        } else {
            self.baseURL = URL(string: "http://localhost:5000")!
        }
        fetchHealth()
    }

    func fetchHealth() {
        let url = baseURL.appendingPathComponent("api/health")
        session.dataTaskPublisher(for: url)
            .map { $0.data }
            .decode(type: HealthResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            }, receiveValue: { [weak self] response in
                self?.health = response
            })
            .store(in: &cancellables)
    }
}
