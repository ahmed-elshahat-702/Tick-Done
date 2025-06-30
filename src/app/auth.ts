import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google";

// import { saltAndHashPassword } from "@/lib/utils";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (
          credentials?.email === "demo@tickdone.com" &&
          credentials?.password === "password"
        ) {
          return {
            id: "1",
            email: "demo@tickdone.com",
            name: "Demo User",
          };
        }
        return null;
      },
    }),
  ],
});
