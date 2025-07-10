"use client";

import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlarmClock,
  Calendar,
  CalendarDays,
  CheckCircle,
  Folders,
  Home,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./logo";
import ThemeToggler from "./theme-toggler";
import { ScrollArea } from "../ui/scroll-area";

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/completed", label: "Completed", icon: CheckCircle },
  { href: "/categories", label: "Categories", icon: Folders },
  { href: "/pomodoro", label: "Pomodoro", icon: AlarmClock },
];

export function Sidebar() {
  const pathname = usePathname();

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

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border h-fit">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-2 px-4 overflow-hidden">
        <ScrollArea className="max-h-full overflow-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label.toLowerCase()}
                href={item.href}
                className={cn(
                  buttonVariants({
                    variant: pathname === item.href ? "secondary" : "ghost",
                  }),
                  "w-full justify-start gap-3 h-10 my-1",
                  pathname === item.href && "bg-secondary"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </ScrollArea>
      </nav>

      {/* Footer */}
      <div className="h-fit overflow-hidden">
        <div className="py-2 px-4 border-t border-border">
          <span className="text-muted-foreground text-sm px-2">Theme</span>
          <ThemeToggler />
        </div>
        <div className="px-4 py-2 border-t border-border space-y-2">
          <Link
            href="/profile"
            className={cn(
              buttonVariants({
                variant: pathname === "/profile" ? "secondary" : "ghost",
              }),
              "w-full justify-start gap-3 h-10 my-2",
              pathname === "/profile" && "bg-secondary"
            )}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>

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
                <AvatarImage
                  src={session?.user?.image || ""}
                  className="w-full h-full object-cover"
                />
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
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden w-full h-16 mx-auto px-6 bg-background fixed top-0 left-0 flex items-center justify-between shadow-sm z-10">
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
