import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { redirectToCheckout } from '@/lib/stripe';
import { MEMBERSHIP_PRICING } from '@/lib/stripe';
import { membershipTiers, type MembershipTier } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier?: 'Ad-free' | 'Premium';
}

export function UpgradeModal({ isOpen, onClose, targetTier }: UpgradeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'Ad-free' | 'Premium'>(targetTier || 'Premium');
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isPWA, setIsPWA] = useState(false);

  // Detect PWA mode for modal positioning
  useEffect(() => {
    const checkPWA = () => {
      const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                       window.matchMedia('(display-mode: fullscreen)').matches ||
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
      setIsPWA(isPWAMode);
    };

    checkPWA();
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);

    return () => mediaQuery.removeEventListener('change', checkPWA);
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in to upgrade your membership.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create checkout session
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', {
        tier: selectedTier,
        interval: selectedInterval,
      });

      if (response.sessionId) {
        // Redirect to Stripe checkout
        await redirectToCheckout(response.sessionId);
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTierInfo = membershipTiers[selectedTier];
  const pricing = MEMBERSHIP_PRICING[selectedTier];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md max-h-[85vh] overflow-y-auto ${
        isPWA 
          ? 'fixed top-[5vh] left-[5vw] right-[5vw] bottom-auto w-[90vw] max-w-md mx-auto translate-x-0 translate-y-0' 
          : 'm-4 w-[calc(100vw-2rem)] sm:w-full'
      }`}>
        <DialogHeader>
          <DialogTitle className="text-center">
            Upgrade to {currentTierInfo.displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tier Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Choose Plan</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedTier('Ad-free')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTier === 'Ad-free'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">🚫 Ad-free</div>
                <div className="text-xs text-gray-500">No advertisements</div>
              </button>
              <button
                onClick={() => setSelectedTier('Premium')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTier === 'Premium'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">⭐ Premium</div>
                <div className="text-xs text-gray-500">All features</div>
              </button>
            </div>
          </div>

          {/* Billing Interval */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Billing</h4>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedInterval('monthly')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedInterval === 'monthly'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Monthly</div>
                    <div className="text-xs text-gray-500">Billed monthly</div>
                  </div>
                  <div className="text-lg font-bold">
                    {pricing.monthly.price}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedInterval('yearly')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedInterval === 'yearly'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      Yearly
                      <Badge variant="secondary" className="text-xs">
                        Save {pricing.yearly.savings}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">Billed annually</div>
                  </div>
                  <div className="text-lg font-bold">
                    {pricing.yearly.price}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">What you get:</h4>
            <ul className="space-y-2">
              {currentTierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 text-lg font-medium"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </div>
              ) : (
                `Upgrade to ${currentTierInfo.name}`
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>

          {/* Security Note */}
          <div className="text-xs text-gray-500 text-center">
            <i className="fas fa-lock mr-1"></i>
            Secure payment processing by Stripe
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}