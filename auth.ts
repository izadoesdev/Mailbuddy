import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./src/libs/db";
import { customSession, emailOTP, multiSession, magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    appName: "mailbuddy.dev",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            scope: [
                "email",
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/gmail.readonly",
            ],
            accessType: "offline",
            prompt: "consent",
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 32,
        requireEmailVerification: true,
        sendResetPassword: async ({user, url, token}, request) => {
            await resend.emails.send({
              from: "noreply@mailbuddy.dev",
              to: user.email,
              subject: "Reset your password",
              text: `Click the link to reset your password: ${url}`,
            });
          },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
    plugins: [
        customSession(async ({ user, session }) => {
            // Fetch the user's role from the database
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { emailVerified: true, accounts: true },
            });

            if (!dbUser) {
                throw new Error("User not found");
            }

            return {
                user: {
                    ...user,
                    accessToken: dbUser.accounts[0].accessToken,
                    refreshToken: dbUser.accounts[0].refreshToken,
                },
                session,
            };
        }),
        multiSession(),
        nextCookies(),
        emailOTP({
            sendVerificationOTP: async ({ email, otp }) => {
                await resend.emails.send({
                    from: "noreply@mailbuddy.dev",
                    to: email,
                    subject: "Verify your email",
                    html: `<p>Your verification code is ${otp}</p>`,
                });
            },
        }),
        magicLink({
            sendMagicLink: async ({ email, token }) => {
                await resend.emails.send({
                    from: "noreply@mailbuddy.dev",
                    to: email,
                    subject: "Login to Mailbuddy",
                    html: `<p>Click <a href="${process.env.BETTER_AUTH_URL}/login?token=${token}">here</a> to login to Mailbuddy</p>`,
                });
            },
        }),
    ],
});

export type User = (typeof auth)["$Infer"]["Session"]["user"];
