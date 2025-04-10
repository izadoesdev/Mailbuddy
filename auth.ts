import { type Account, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./src/libs/db";
import { customSession, multiSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { ResetPasswordEmail } from "./src/email-templates/reset-password";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    appName: "mailbuddy.ai",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            scope: [
                "email",
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/gmail.readonly",
            ],
            prompt: "consent",
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        async sendResetPassword({ token, url, user }) {
            console.log(`[sendResetPassword] token: ${token}, url: ${url}, user:`, user);
            const { error } = await resend.emails.send({
                from: process.env.EMAIL_SENDER as string,
                to: [user.email],
                subject: "Reset Password",
                react: ResetPasswordEmail({ resetPasswordLink: url, userFirstname: user.name }),
            });

            if (error) {
                console.log("[sendResetPassword] error:", error);
            }
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
    ],
});

export type User = (typeof auth)["$Infer"]["Session"]["user"];
