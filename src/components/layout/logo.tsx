import { CheckCircle } from "lucide-react";
import React from "react";

const Logo = () => {
  return (
    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
      <CheckCircle className="w-5 h-5 text-primary-foreground" />
    </div>
  );
};

export default Logo;
