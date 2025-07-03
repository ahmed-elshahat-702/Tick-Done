import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
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
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+hashedPassword"
        );

        if (!user) return null;

        const isValid = await compare(
          String(credentials.password),
          user.hashedPassword as string
        );

        if (!isValid) return null;

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
      await connectDB();
      if (account?.provider === "google" && profile) {
        let dbUser = await User.findOne({ email: profile.email });
        if (!dbUser) {
          dbUser = await User.create({
            name: profile.name,
            email: profile.email,
            image: profile.picture,
          });
        }
        return true;
      }
      return true;
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
