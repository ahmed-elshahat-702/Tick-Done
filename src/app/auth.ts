import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { compare } from "bcryptjs";
import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export class InvalidLoginError extends AuthError {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

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
            throw new InvalidLoginError("Missing credentials");
          }

          await connectDB();

          const user = await User.findOne({ email: credentials.email }).select(
            "+hashedPassword +authProvider"
          );

          if (!user) {
            throw new InvalidLoginError("Invalid email or password");
          }

          if (!user.hashedPassword) {
            throw new InvalidLoginError(
              "This email is assigned to Google sign-in"
            );
          }

          const isValid = await compare(
            String(credentials.password),
            user.hashedPassword as string
          );

          if (!isValid) {
            throw new InvalidLoginError("Invalid email or password");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          throw error instanceof InvalidLoginError
            ? error
            : new InvalidLoginError("An error occurred during authentication");
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
          let dbUser = await User.findOne({ email: profile.email }).select(
            "+authProvider"
          );
          if (!dbUser) {
            dbUser = await User.create({
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              authProvider: "google",
            });
          } else if (dbUser.authProvider === "credentials") {
            throw new InvalidLoginError(
              "This email is assigned to credentials sign-in"
            );
          }
          return true;
        }
        return true;
      } catch (error) {
        throw error instanceof InvalidLoginError
          ? error
          : new InvalidLoginError("Failed to process Google sign-in");
      }
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token) session.user.id = token.id as string;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
