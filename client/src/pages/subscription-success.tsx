import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    const sessionIdParam = params.get('session_id');
    setSessionId(sessionIdParam);

    // Optional: Verify the session was successful with your backend
    if (sessionIdParam) {
      console.log('Checkout session completed:', sessionIdParam);
      // Could make an API call to verify and update user data
    }
  }, []);

  return (
    <div className="app-gradient-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mt-12 mb-6">
        <div className="w-10"></div> {/* Spacer */}
        <h1 className="text-xl font-bold text-white">Success!</h1>
        <div 
          onClick={() => setLocation('/profile')}
          className="w-10 h-10 flex items-center justify-center cursor-pointer text-black bg-white/90 hover:bg-white rounded-full"
        >
          <i className="fas fa-times text-xl text-black"></i>
        </div>
      </div>

      <main className="px-4 max-w-lg mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mb-6">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-check text-green-600 text-3xl"></i>
              </div>

              {/* Success Message */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  Welcome to Premium!
                </h2>
                <p className="text-gray-600">
                  Your subscription has been activated successfully. You now have access to all premium features.
                </p>
              </div>

              {/* Features Unlocked */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  ✨ Features Now Available:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                    Ad-free experience
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                    Custom goals
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                    Data export
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                    Priority support
                  </li>
                </ul>
              </div>

              {/* Current Membership Display */}
              {user?.membership && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Your current plan:</div>
                  <div className="text-lg font-bold text-purple-600">
                    {user.membership === 'Ad-free' ? '🚫 Ad-free' : '⭐ Premium'}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => setLocation('/home')}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3"
                >
                  <i className="fas fa-home mr-2"></i>
                  Go to Dashboard
                </Button>
                
                <Button
                  onClick={() => setLocation('/profile')}
                  variant="outline"
                  className="w-full"
                >
                  <i className="fas fa-user mr-2"></i>
                  View Profile
                </Button>
              </div>

              {/* Receipt Info */}
              {sessionId && (
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                  <p>
                    <i className="fas fa-receipt mr-1"></i>
                    A receipt has been sent to your email address.
                  </p>
                  <p className="mt-1">
                    Session ID: {sessionId.slice(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Support Note */}
        <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-600">
              <i className="fas fa-question-circle mr-2 text-blue-500"></i>
              Need help? Contact our support team for priority assistance.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}