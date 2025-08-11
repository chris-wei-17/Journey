import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/home");
    } else {
      setLocation("/"); // This will show the auth component for non-authenticated users
    }
  };

  const handleLearnMore = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="Journey" />
      
      {/* Hero Section */}
      <section className="pt-[calc(env(safe-area-inset-top)+6rem)] pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your Fitness
              <span className="block text-primary-600">Journey Today</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Your comprehensive fitness companion that tracks progress, captures memories, and helps you achieve your health goals with precision and motivation.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={handleGetStarted}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              Start Your Journey
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleLearnMore('features')}
              className="border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200"
            >
              Learn More
            </Button>
          </div>

          {/* Hero Image Placeholder */}
          <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8 shadow-xl">
            <div className="bg-white rounded-xl p-6 shadow-inner">
              <p className="text-gray-500 text-center">
                [App Screenshot - Dashboard Overview]
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Comprehensive dashboard showing your fitness metrics, progress charts, and goal tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Journey combines powerful tracking tools with intuitive design to make fitness monitoring effortless and effective.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-2xl text-primary-600"></i>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  Monitor your fitness metrics with detailed charts and analytics. Track weight, body measurements, and custom goals with precision.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-camera text-2xl text-secondary-600"></i>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Photo Journal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  Capture your transformation with progress photos. Visual documentation helps maintain motivation and track changes over time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-apple-alt text-2xl text-accent-600"></i>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Nutrition Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  Log meals and track macronutrients with ease. Maintain a balanced diet that supports your fitness goals and lifestyle.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Screenshot Placeholder */}
          <div className="bg-gradient-to-r from-primary-100 to-lavender-100 rounded-2xl p-8 shadow-xl">
            <div className="bg-white rounded-xl p-6 shadow-inner">
              <p className="text-gray-500 text-center text-lg font-semibold">
                [App Screenshots - Features Grid]
              </p>
              <p className="text-sm text-gray-400 mt-2 text-center">
                Side-by-side comparison showing progress charts, photo gallery, and nutrition logging interface
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Steps to Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with Journey is straightforward. Follow these simple steps to begin your transformation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Set Your Goals</h3>
              <p className="text-gray-600 leading-relaxed">
                Define your fitness objectives and create personalized targets. Whether it's weight loss, muscle gain, or general wellness, Journey adapts to your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Track Daily</h3>
              <p className="text-gray-600 leading-relaxed">
                Log your workouts, meals, and measurements consistently. The intuitive interface makes daily tracking quick and effortless.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">See Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor your progress with detailed analytics and visual reports. Celebrate milestones and adjust your approach based on data-driven insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Journey?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the advantages that make Journey the preferred choice for fitness enthusiasts worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-shield-alt text-primary-600"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy First</h3>
                    <p className="text-gray-600">Your health data is encrypted and secure. We prioritize your privacy and never share personal information.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-mobile-alt text-secondary-600"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Works Everywhere</h3>
                    <p className="text-gray-600">Progressive web app technology ensures Journey works seamlessly across all devices and platforms.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-brain text-accent-600"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Insights</h3>
                    <p className="text-gray-600">AI-powered analytics provide personalized recommendations and identify patterns in your fitness journey.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-lavender-100 to-primary-100 rounded-2xl p-8 shadow-xl">
              <div className="bg-white rounded-xl p-6 shadow-inner">
                <p className="text-gray-500 text-center text-lg font-semibold">
                  [App Screenshot - Analytics Dashboard]
                </p>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Advanced analytics showing trend analysis, goal progress, and personalized insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of users who have transformed their lives with Journey's comprehensive fitness tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold">SM</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">Sarah M.</h4>
                    <p className="text-sm text-gray-500">Fitness Enthusiast</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  "Journey helped me lose 30 pounds in 6 months. The photo tracking feature kept me motivated, and the analytics showed exactly what was working."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                    <span className="text-secondary-600 font-bold">DL</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">David L.</h4>
                    <p className="text-sm text-gray-500">Marathon Runner</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  "The nutrition tracking is incredibly detailed. I optimized my meal plan and improved my marathon time by 15 minutes using Journey's insights."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                    <span className="text-accent-600 font-bold">EK</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">Emily K.</h4>
                    <p className="text-sm text-gray-500">Yoga Instructor</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  "Journey's holistic approach to wellness tracking aligns perfectly with my yoga practice. It's more than just fitness - it's lifestyle transformation."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already started their transformation. Begin tracking your progress today with Journey's comprehensive fitness platform.
          </p>
          <Button 
            onClick={handleGetStarted}
            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">Journey</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Your comprehensive fitness companion for tracking progress, achieving goals, and transforming your health journey with precision and motivation.
              </p>
              <Button 
                onClick={() => setLocation("/blog-feed")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Read Our Blog
              </Button>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Progress Tracking</li>
                <li>Photo Journal</li>
                <li>Nutrition Logging</li>
                <li>Goal Setting</li>
                <li>Analytics Dashboard</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact Us</li>
                <li>Feedback</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Journey. All rights reserved. Transform your fitness journey today.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
