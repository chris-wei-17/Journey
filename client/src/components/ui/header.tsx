import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBackButton = false, onBack }: HeaderProps = {}) {
  const { user } = useAuth();

  return (
    <header className="bg-white/75 backdrop-blur-sm shadow-lg border-0 px-4 fixed top-0 left-0 right-0 z-50 
      pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
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
        
        {/* Right side - Avatar */}
        <Link href="/profile">
          <div className="cursor-pointer">
            <Avatar
              firstName={user?.firstName || undefined}
              lastName={user?.lastName || undefined}
              profileImageUrl={user?.profileImageUrl || undefined}
              size="sm"
            />
          </div>
        </Link>
      </div>
    </header>
  );
}