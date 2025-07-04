import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { compare } from "bcryptjs";
import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

import type { JWT } from "next-auth/jwt";

interface AppUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
}

// Extend the default Session type to include 'bio'
declare module "next-auth" {
  interface Session {
    user: AppUser;
  }
}

interface AppJWT extends JWT {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile: {
        sub: string;
        name: string;
        email: string;
        picture: string;
      }) {
        const user: AppUser = {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          bio: "",
        };
        return user;
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      profile(profile: {
        login: string | null | undefined;
        id: number;
        name?: string | null;
        email?: string | null;
        avatar_url?: string;
      }) {
        const user: AppUser = {
          id: profile.id.toString(), // Convert to string for consistency
          name: profile.name || profile.login, // Fallback to login if name is null
          email: profile.email || "", // GitHub may not always provide email
          image: profile.avatar_url || "",
          bio: "",
        };
        return user;
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new AuthError("Missing credentials");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+hashedPassword +authProvider"
        );

        if (!user) {
          throw new AuthError("User not found");
        }

        if (user.authProvider === "google") {
          throw new AuthError("This email is assigned to Google sign-in");
        }

        const isValid = await compare(
          String(credentials.password),
          user.hashedPassword
        );

        if (!isValid) {
          throw new AuthError("Invalid password");
        }

        const appUser: AppUser = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          bio: user.bio || "",
          image: user.image,
        };

        return appUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ account, profile }) {
      await connectDB();

      if (account?.provider === "google" && profile) {
        let dbUser = await User.findOne({ email: profile.email });
        if (!dbUser) {
          dbUser = await User.create({
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            bio: "",
            authProvider: "google",
          });
        } else {
          if (dbUser.authProvider !== "google") {
            await User.updateOne(
              { email: profile.email },
              {
                name: profile.name,
                image: profile.picture,
                authProvider: "google",
              }
            );
          }
        }
        return true;
      }
      if (account?.provider === "github" && profile) {
        let dbUser = await User.findOne({ email: profile.email || "" });
        if (!dbUser && profile.email) {
          dbUser = await User.create({
            name: profile.name || profile.login,
            email: profile.email,
            image: profile.avatar_url,
            bio: "",
            authProvider: "github",
          });
        } else if (dbUser && dbUser.authProvider !== "github") {
          await User.updateOne(
            { email: profile.email },
            {
              name: profile.name || profile.login,
              image: profile.avatar_url,
              authProvider: "github",
            }
          );
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      const appToken = token as AppJWT;
      if (user) {
        appToken.id = (user as AppUser).id;
        appToken.name = user.name;
        appToken.email = user.email;
        appToken.image = user.image;
        appToken.bio = (user as AppUser).bio;
      }
      if (account?.provider === "google" || account?.provider === "github") {
        await connectDB();
        const dbUser = await User.findOne({ email: appToken.email });
        if (dbUser) {
          appToken.id = dbUser._id.toString();
          appToken.name = dbUser.name;
          appToken.image = dbUser.image;
          appToken.bio = dbUser.bio || "";
        }
      }
      return appToken;
    },
    async session({ session, token }) {
      const appToken = token as AppJWT;
      if (appToken.id && session.user) {
        session.user = {
          id: String(appToken.id),
          name: appToken.name,
          email: appToken.email ?? "",
          image: appToken.image,
          bio: appToken.bio ?? "",
          emailVerified: null,
        };
      }
      if (session.user?.email) {
        await connectDB();

        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          session.user = {
            ...session.user,
            name: dbUser.name,
            image: dbUser.image,
            bio: dbUser.bio || "",
          };
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
