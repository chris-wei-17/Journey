import { useState } from "react";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Feedback() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async () => {
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
      await apiRequest("POST", "/api/feedback", { 
        feedback: feedback.trim() 
      });

      toast({
        title: "Feedback Sent",
        description: "Thank you for your feedback! We'll review it and get back to you if needed.",
      });

      setFeedback("");
      setTimeout(() => setLocation("/home"), 2000);
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
    <div className="app-gradient-bg">
      <Header 
        title="Feedback"
        showBackButton={true}
        showHomeButton={true}
        onBack={handleBack}
      />

      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-2xl mx-auto">
        <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              We'd Love Your Feedback
            </CardTitle>
            <p className="text-sm text-gray-600">
              Help us improve Journey by sharing your thoughts, suggestions, or reporting issues.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think about Journey, suggest improvements, or report any issues you've encountered..."
                className="min-h-[240px] resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Share anything that would help us make Journey better for you
                </p>
                <p className="text-xs text-gray-400">
                  {feedback.length}/2000
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="w-full shadow-md hover:shadow-lg transition-shadow"
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

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Your feedback helps us improve Journey for everyone
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}