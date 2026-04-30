import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Sign-ins are restricted to a single hosted-domain SSO. Set
// AUTH_ALLOWED_EMAIL_DOMAIN to override (e.g. for staging); defaults
// to ramosjames.com so the Ramos James internal team is the only group
// that can reach the admin panel.
const ALLOWED_DOMAIN = (process.env.AUTH_ALLOWED_EMAIL_DOMAIN || "ramosjames.com")
  .toLowerCase()
  .replace(/^@/, "");

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // hd asks Google's consent screen to filter the account picker
      // to the workspace domain. It's an advisory hint; we still
      // re-check the email server-side in the signIn callback below.
      authorization: { params: { hd: ALLOWED_DOMAIN, prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ profile, account }) {
      if (account?.provider !== "google") return false;
      const email = profile?.email?.toLowerCase() || "";
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      if (!email || !verified) return false;
      const domain = email.split("@")[1] || "";
      if (domain !== ALLOWED_DOMAIN) return false;
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.email) token.email = profile.email;
      const p = profile as { picture?: string; name?: string } | undefined;
      if (p?.picture) token.picture = p.picture;
      if (p?.name) token.name = p.name;
      return token;
    },
    async session({ session, token }) {
      if (token.email) session.user = { ...session.user, email: token.email as string };
      if (token.name) session.user = { ...session.user, name: token.name as string };
      if (token.picture) session.user = { ...session.user, image: token.picture as string };
      return session;
    },
  },
};
