import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { compare } from "bcryptjs";
import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Connect to DB once at module level (if safe for your setup)
connectDB();

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
        return {
          id: profile.sub, // Temporary ID, overridden in jwt callback
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
        if (!credentials?.email || !credentials?.password) {
          throw new AuthError("Missing credentials");
        }

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

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
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
      if (account?.provider === "google" && profile) {
        let dbUser = await User.findOne({ email: profile.email });
        if (!dbUser) {
          dbUser = await User.create({
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            authProvider: "google",
          });
        } else {
          await User.updateOne(
            { email: profile.email },
            {
              name: profile.name,
              image: profile.picture,
              authProvider: "google",
            }
          );
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      if (account?.provider === "google") {
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString(); // Ensure token.id is DB _id
          token.name = dbUser.name;
          token.image = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        // Ensure session.user exists and has an 'id' property of type string
        (session.user as { id?: string }).id = String(token.id); // Ensure session.user.id matches DB _id
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image =
          (token.picture as string) || (token.image as string);
      }
      // Update session with latest DB data
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
