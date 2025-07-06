"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

const ProvidersButtons = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      await signIn("google");
    } catch (error) {
      toast.error("An unexpected error occurred during Google sign-in.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    try {
      setIsLoading(true);
      await signIn("github");
    } catch (error) {
      toast.error("An unexpected error occurred during Github sign-in.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="w-full grid md:grid-cols-2 items-center gap-4">
      {/* Google */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleAuth}
        disabled={isLoading}
      >
        <div className="relative w-5 h-5 mr-2">
          <Image
            src="/google-logo.svg"
            alt="Google"
            fill
            className="object-cover"
          />
        </div>
        Continue with Google
      </Button>

      {/* Github Sign-in */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGithubAuth}
        disabled={isLoading}
      >
        <Github className="w-5 h-5 mr-2" />
        Continue with Github
      </Button>
    </div>
  );
};

export default ProvidersButtons;
