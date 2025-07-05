"use client";

import { deleteUserTasks } from "@/actions/tasks";
import { changePassword } from "@/actions/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTaskStore } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Target,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Cropper, { Area } from "react-easy-crop";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { LoadingSpinner } from "./layout/loading-spinner";
import { v4 as uuidv4 } from 'uuid';

// Schema for password change
const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user session data
  const { data: session, update } = useSession();
  const user = session?.user;

  // Local state for editable fields
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [image, setImage] = useState<string>(user?.image || "");

  const { tasks } = useTaskStore();

  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // Update local state when user changes (e.g., after login)
  useEffect(() => {
    setName(user?.name || "");
    setBio(user?.bio || "");
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

  const randomImageName = `${user?.email}-${uuidv4()}`;

  // Function to get cropped image
  const getCroppedImage = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<File> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          resolve(new File([blob], randomImageName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9
      );
    });
  };

  // Handle crop completion
  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Handle file selection for cropping
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.[0]) return;

    const file = files[0];
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error("Only JPEG, PNG, or GIF images are allowed");
      return;
    }

    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image size must be less than 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset file input to allow reselecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle image upload after cropping
  const handleCropAndUpload = async () => {
    if (!imageToCrop || !croppedAreaPixels) {
      toast.error("No image to crop or crop area not set");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const croppedImageFile = await getCroppedImage(imageToCrop, croppedAreaPixels);
      const oldImageUrl = image;

      // Upload cropped image
      const formData = new FormData();
      formData.append("file", croppedImageFile);

      const uploadResponse = await fetch("/api/uploadthing", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const responseData = await uploadResponse.json();
      if (!responseData?.url) {
        throw new Error("No URL returned from upload");
      }
      const newImageUrl = responseData.url;

      // Update user profile with new image
      const updateResponse = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, image: newImageUrl }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update profile");
      }

      // Update session and local state
      await update({ name, bio, image: newImageUrl });
      setImage(newImageUrl);

      // Delete old image after successful profile update
      if (oldImageUrl && oldImageUrl.startsWith("https://utfs.io/f/")) {
        const fileKey = oldImageUrl.split("/f/")[1]?.split("?")[0];
        if (fileKey) {
          const deleteResponse = await fetch("/api/uploadthing", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey }),
          });
          
          if (!deleteResponse.ok) {
            console.error("Failed to delete old image, but profile updated successfully");
          }
        }
      }

      setIsCropModalOpen(false);
      setImageToCrop(null); // Reset imageToCrop after successful upload
      toast.success("Profile updated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle dialog close (for Cancel button)
  const handleCropDialogClose = () => {
    setIsCropModalOpen(false);
    setImageToCrop(null); // Reset imageToCrop when dialog is closed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  // Save profile changes
  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, image }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      await update({ name, bio, image });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setIsSaving(true);
    setError("");
    try {
      const res = await changePassword(data.currentPassword, data.newPassword);

      if (res?.error) {
        throw new Error(res.error);
      }

      if (res?.success) {
        toast.success(res.success);
        await signOut({ callbackUrl: "/auth/signin" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Password change failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError("");
    try {
      // Delete profile image if it exists
      if (image && image.startsWith("https://utfs.io/f/")) {
        const fileKey = image.split("/f/")[1]?.split("?")[0];
        if (fileKey) {
          console.log("Attempting to delete image with fileKey:", fileKey); // Log for debugging
          const deleteResponse = await fetch("/api/uploadthing", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey }),
          });

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            console.error("Image deletion failed:", errorData);
            throw new Error(errorData.error || "Failed to delete profile image");
          }

          const deleteResult = await deleteResponse.json();
          if (!deleteResult.success) {
            console.error("Image deletion unsuccessful:", deleteResult);
            throw new Error("Failed to delete profile image");
          }
        }
      }

      // Delete user tasks and account
      await Promise.all([
        fetch("/api/user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to delete account");
        }),
        deleteUserTasks(),
      ]);

      await signOut({ callbackUrl: "/auth/signin" });
      toast.success("Account deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error:", err);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
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
                className="w-full h-full object-cover"
              />
              <AvatarFallback className="text-lg">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              {isEditing && (
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-all"
                  >
                    Upload Image
                  </label>
                </div>
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
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={!isEditing}
              readOnly={!isEditing}
              placeholder="Tell us about yourself"
              rows={4}
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

      {/* Crop Modal */}
      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Your Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust the image to fit your profile picture.
            </DialogDescription>
          </DialogHeader>
          <div style={{ position: "relative", width: "100%", height: "400px" }}>
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCropDialogClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCropAndUpload} disabled={isSaving}>
              {isSaving ? "Saving..." : "Crop & Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Productivity Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Productivity Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mx-auto">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      {(user?.authProvider === "credentials" || !user?.authProvider) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleSubmit(handleChangePassword)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...register("currentPassword")}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isSaving}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...register("newPassword")}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isSaving}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSaving}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <LoadingSpinner />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Are you sure you want to delete your account?
                </DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be undone. All your data
                  will be removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}