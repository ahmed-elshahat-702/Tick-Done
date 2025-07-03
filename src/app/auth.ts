import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { compare } from "bcryptjs";
import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      name: "Google",
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
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
            user.hashedPassword as string
          );

          if (!isValid) {
            throw new AuthError("Invalid password");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          throw new AuthError(
            error instanceof AuthError
              ? error.message
              : "An error occurred during authentication"
          );
        }
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
      try {
        await connectDB();
        if (account?.provider === "google" && profile) {
          let dbUser = await User.findOne({ email: profile.email });
          if (!dbUser) {
            dbUser = await User.create({
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              authProvider: "google", // Add authProvider to track Google users
            });
          } else {
            // Update existing user if needed
            await User.updateOne(
              { email: profile.email },
              {
                name: profile.name,
                image: profile.picture,
                authProvider: "google",
              }
            );
          }
          // Ensure the user object is returned for session creation
          return true;
        }
        return true;
      } catch (error) {
        console.error("Sign-in callback error:", error);
        throw new AuthError(
          error instanceof AuthError
            ? error.message
            : "Failed to process Google sign-in"
        );
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      if (account?.provider === "google") {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.image = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image =
          (token.picture as string) || (token.image as string);
      }
      // Fetch latest user data from DB
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        session.user.name = dbUser.name;
        session.user.image = dbUser.image;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
