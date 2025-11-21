import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "./db";

export const { handlers, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email?: string;
          password?: string;
        };

        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        return ok
          ? {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
            }
          : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
});
export const getCurrentUserName = (): string => {
  try {
    const authUser = localStorage.getItem("auth_user");
    if (authUser) {
      const user = JSON.parse(authUser);
      if (user?.firstName) {
        return user.firstName;
      }
    }

    const authToken = localStorage.getItem("auth_token");
    if (authToken) {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: any) => u.email === authToken);
      if (user?.firstName) {
        return user.firstName;
      }
    }

    return "User";
  } catch {
    return "User";
  }
};
