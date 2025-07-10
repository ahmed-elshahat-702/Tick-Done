import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { compare } from "bcryptjs";
import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

import type { JWT } from "next-auth/jwt";
import { TaskList } from "@/models/TaskList";

interface AppUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  authProvider?: string | null;
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
  authProvider?: string | null;
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
      profile(profile) {
        const user: AppUser = {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          bio: "",
          authProvider: "google",
        };
        return user;
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      profile(profile) {
        const user: AppUser = {
          id: profile.id?.toString(),
          name: profile.name || profile.login,
          email: profile.email || "",
          image: profile.avatar_url || "",
          bio: "",
          authProvider: "github",
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

        const isMyTaskListExist = await await TaskList.findOne({
          name: "My Tasks",
        });

        if (!isMyTaskListExist) {
          await TaskList.create({
            name: "My Tasks",
            userId: user._id,
            description: "",
            color: "#000000",
          });
        }

        const appUser: AppUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio || "",
          image: user.image,
          authProvider: user.authProvider,
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
          await TaskList.create({
            name: "My Tasks",
            userId: dbUser._id,
            description: "",
            color: "#000000",
          });
        } else if (dbUser.authProvider !== "google") {
          await User.updateOne(
            { email: profile.email },
            {
              name: profile.name,
              image: profile.picture,
              authProvider: "google",
            }
          );
        }
        // Store MongoDB _id in profile for jwt callback
        profile.id = dbUser._id.toString();
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
          await TaskList.create({
            name: "My Tasks",
            userId: dbUser._id,
            description: "",
            color: "#000000",
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
        // Store MongoDB _id in profile for jwt callback
        profile.id = dbUser._id.toString();
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
        appToken.authProvider = (user as AppUser).authProvider;
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
          id: String(appToken.id), // MongoDB _id as string
          name: appToken.name,
          email: appToken.email ?? "",
          image: appToken.image,
          bio: appToken.bio ?? "",
          emailVerified: null,
          authProvider: appToken.authProvider,
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
            authProvider: dbUser.authProvider,
          };
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
