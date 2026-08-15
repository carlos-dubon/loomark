import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { ensureUnsortedCollection } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/schemas"

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials)

        if (!parsed.success) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user?.passwordHash) {
          return null
        }

        const valid = await compare(parsed.data.password, user.passwordHash)

        if (!valid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  events: {
    createUser: ({ user }) => {
      if (!user.id) {
        return
      }

      return ensureUnsortedCollection(user.id).then(() => undefined)
    },
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id
      }

      return token
    },
    session: ({ session, token }) => {
      if (token.sub) {
        session.user.id = token.sub
      }

      return session
    },
  },
})
