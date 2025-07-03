"use client";

import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle,
  Home,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import Logo from "./logo";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "today", label: "Today", icon: CheckCircle },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "completed", label: "Completed", icon: CheckCircle },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: "/auth/signin" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                activeView === item.id && "bg-secondary"
              )}
              onClick={() => handleViewChange(item.id)}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          Toggle Theme
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10"
          onClick={() => handleViewChange("profile")}
        >
          <User className="w-4 h-4" />
          Profile
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>

        {/* User Info */}
        {status === "loading" ? (
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden w-full h-16 mx-auto px-6 bg-background fixed top-0 left-0 flex items-center justify-between shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
        <Logo />
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-card border-r border-border flex-col">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
