import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logo.svg" alt="Logo" width={30} height={30} />
      <h1 className="font-semibold text-lg">Tick Done</h1>
    </Link>
  );
};

export default Logo;
