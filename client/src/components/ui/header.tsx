import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { NavigationMenu } from "@/components/ui/navigation-menu";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Navigation Menu */}
        <div className="flex items-center space-x-4">
          <NavigationMenu />
          <h1 className="text-xl font-bold text-gray-800">FitJourney</h1>
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