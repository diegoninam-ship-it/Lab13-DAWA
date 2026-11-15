import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  validateCredentials,
  getLoginStatus,
  registerFailedAttempt,
  resetAttempts,
} from "@/lib/users";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Correo y contraseña son obligatorios.");
        }

        const status = getLoginStatus(credentials.email);
        if (status.locked) {
          const minutesLeft = Math.ceil(
            ((status.lockedUntil as number) - Date.now()) / 60000
          );
          throw new Error(
            `Demasiados intentos fallidos. Intenta de nuevo en ${minutesLeft} minuto(s).`
          );
        }

        const user = await validateCredentials(
          credentials.email,
          credentials.password
        );

        if (!user) {
          registerFailedAttempt(credentials.email);
          throw new Error("Correo o contraseña incorrectos.");
        }

        resetAttempts(credentials.email);
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/signIn",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };