import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  showHomeButton?: boolean;
}

export function Header({ title, showBackButton = false, onBack, showHomeButton = false }: HeaderProps = {}) {
  const { user } = useAuth();

  return (
    <header className="bg-white/75 backdrop-blur-sm shadow-lg border-0 px-4 fixed top-0 left-0 right-0 z-50 
      pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 min-h-[calc(env(safe-area-inset-top)+4rem)]">
      <div className="flex items-center justify-between">
        {/* Left side - Back button or Navigation Menu */}
        <div className="flex items-center space-x-4">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack || (() => window.history.back())}
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50/50 p-2 flex items-center gap-2"
            >
              <i className="fas fa-arrow-left text-lg"></i>
              <span>Back</span>
            </Button>
          ) : (
            <NavigationMenu />
          )}
          <h1 className="text-xl font-bold text-gray-800">
            {title || "Journey"}
          </h1>
        </div>
        
        {/* Right side - Home button and Avatar */}
        <div className="flex items-center space-x-3">
          {showHomeButton && (
            <Link href="/">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                <i className="fas fa-home text-sm" style={{ color: '#000000' }}></i>
              </div>
            </Link>
          )}
          <Link href="/profile">
            <div className="w-8 h-8 flex items-center justify-center cursor-pointer">
              <Avatar
                firstName={user?.firstName || undefined}
                lastName={user?.lastName || undefined}
                profileImageUrl={user?.profileImageUrl || undefined}
                size="sm"
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}