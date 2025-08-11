import { useState } from "react";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function PublicFeedback() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: "No Feedback",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (feedback.trim().length < 10) {
      toast({
        title: "Too Short",
        description: "Please provide more detailed feedback (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/public-feedback", { 
        name: name.trim(),
        email: email.trim(),
        feedback: feedback.trim() 
      });

      toast({
        title: "Feedback Sent",
        description: "Thank you for your feedback! We'll review it and get back to you if needed.",
      });

      setName("");
      setEmail("");
      setFeedback("");
      setTimeout(() => setLocation("/"), 2000);
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error?.message || "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="Feedback" />

      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-xl border border-gray-100">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                We'd Love Your Feedback
              </CardTitle>
              <p className="text-gray-600">
                Help us improve Journey by sharing your thoughts, suggestions, or reporting issues. We'll get back to you if needed.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Your Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1"
                    maxLength={100}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="mt-1"
                    maxLength={255}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="feedback" className="text-sm font-medium text-gray-700">
                  Your Feedback *
                </Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think about Journey, suggest improvements, or report any issues you've encountered..."
                  className="min-h-[200px] resize-none mt-1"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Share anything that would help us make Journey better
                  </p>
                  <p className="text-xs text-gray-400">
                    {feedback.length}/2000
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">What kind of feedback can you share?</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Feature requests and suggestions</li>
                  <li>• Bug reports and technical issues</li>
                  <li>• User experience improvements</li>
                  <li>• General thoughts about the app</li>
                  <li>• Questions about functionality</li>
                </ul>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim() || !email.trim() || !feedback.trim()}
                className="w-full bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sending Feedback...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Feedback
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">
                  Your feedback helps us improve Journey for everyone
                </p>
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}