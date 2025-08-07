import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { membershipTiers, hasMembershipFeature, type MembershipTier } from "@shared/schema";

interface MembershipCardProps {
  showUpgradeOptions?: boolean;
  className?: string;
}

export function MembershipCard({ showUpgradeOptions = false, className = "" }: MembershipCardProps) {
  const { user } = useAuth();
  
  if (!user?.membership) {
    return null;
  }

  const currentTier = membershipTiers[user.membership as MembershipTier];
  
  return (
    <Card className={`bg-white/75 backdrop-blur-sm border-0 shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-800">
            Membership
          </span>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {currentTier.displayName}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-gray-600 text-sm mb-3">
            {currentTier.description}
          </p>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Your Benefits:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {currentTier.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature Status Indicators */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
          <div className="text-center">
            <div className={`text-xs font-medium ${hasMembershipFeature(user.membership as MembershipTier, 'ads-free') ? 'text-green-600' : 'text-gray-500'}`}>
              {hasMembershipFeature(user.membership as MembershipTier, 'ads-free') ? '🚫 Ad-Free' : '📢 Ads Enabled'}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-xs font-medium ${hasMembershipFeature(user.membership as MembershipTier, 'premium-analytics') ? 'text-blue-600' : 'text-gray-500'}`}>
              {hasMembershipFeature(user.membership as MembershipTier, 'premium-analytics') ? '📊 Analytics' : '📈 Basic Stats'}
            </div>
          </div>
        </div>

        {showUpgradeOptions && user.membership === 'Free' && (
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  // TODO: Implement upgrade flow
                  alert('Upgrade functionality coming soon!');
                }}
              >
                🚫 Upgrade to Ad-Free
              </Button>
              <Button 
                size="sm" 
                className="w-full text-xs bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                onClick={() => {
                  // TODO: Implement upgrade flow
                  alert('Upgrade functionality coming soon!');
                }}
              >
                ⭐ Upgrade to Premium
              </Button>
            </div>
          </div>
        )}

        {user.membership === 'Premium (beta)' && (
          <div className="pt-3 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-800">
                <i className="fas fa-flask mr-1"></i>
                <strong>Beta Tester</strong>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Thanks for helping us test new features! Your feedback shapes the future of Journey.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple membership badge for headers/navigation
export function MembershipBadge({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  
  if (!user?.membership) {
    return null;
  }

  const tier = membershipTiers[user.membership as MembershipTier];
  
  return (
    <Badge variant="secondary" className={`text-xs ${className}`}>
      {tier.emoji} {tier.name}
    </Badge>
  );
}