"use client";

import { useState, useEffect } from "react";
import { User, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { UploadButton } from "@/lib/uploadthing";
import type { ClientUploadedFileData } from "uploadthing/types";

export function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Get user session data
  const { data: session, update } = useSession();
  const user = session?.user;

  // Local state for editable fields
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState<string>(user?.image || "");

  // Update local state when user changes (e.g., after login)
  useEffect(() => {
    setName(user?.name || "");
    setImage(user?.image || "");
  }, [user]);

  // Helper to get initials
  function getInitials(name?: string) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  // Save profile changes
  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      await update({ name, image }); // Pass updated fields
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadComplete = async (
    res: ClientUploadedFileData<{ uploadedBy: string }>[] | undefined
  ) => {
    if (!res?.[0]?.url) return;
    setImage(res[0].url);
    setIsSaving(true);
    setError("");
    try {
      const resp = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: res[0].url }),
      });
      if (!resp.ok) throw new Error("Failed to update profile");
      await update({ name, image: res[0].url }); // Pass updated fields
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={image || user?.image || "/placeholder-user.jpg"}
              />
              <AvatarFallback className="text-lg">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              {isEditing && (
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(err) => setError(err.message)}
                  appearance={{
                    button: {
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      lineHeight: "1.25rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      backgroundColor: "#ffffff",
                      color: "#111827",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    },
                    allowedContent: {
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    },
                    clearBtn: {
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      lineHeight: "1.25rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      backgroundColor: "#ffffff",
                      color: "#dc2626",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    },
                    container: {
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "transparent",
                    },
                  }}
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              readOnly={!isEditing}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
          </div>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
