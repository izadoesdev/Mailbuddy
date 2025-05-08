import index from "@/app/(dev)/ai/new/index";
import env from "@/libs/env";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { customSession, emailOTP, magicLink, multiSession, twoFactor } from "better-auth/plugins";
import { Resend } from "resend";
import { prisma, redis } from "./src/libs/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    appName: "mailbuddy.dev",
    user: {
        deleteUser: {
            enabled: true,
            beforeDelete: async (user) => {
                await index.index.deleteNamespace(`user_${user.id}`);
            },
        },
    },
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
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
        sendResetPassword: async ({ user, url, token }, request) => {
            await resend.emails.send({
                from: "noreply@mailbuddy.dev",
                to: user.email,
                subject: "Reset your password",
                text: `Click the link to reset your password: ${url}`,
            });
        },
    },
    emailVerification: {
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            await resend.emails.send({
                from: "noreply@mailbuddy.dev",
                to: user.email,
                subject: "Verify your email",
                html: `<p>Click <a href="${url}">here</a> to verify your email</p>`,
            });
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    secondaryStorage: {
        get: async (key) => {
            const value = await redis.get(key);
            return value ? value : null;
        },
        set: async (key, value, ttl) => {
            if (ttl) await redis.set(key, value, "EX", ttl);
            else await redis.set(key, value);
        },
        delete: async (key) => {
            await redis.del(key);
        },
    },
    plugins: [
        multiSession(),
        nextCookies(),  
        twoFactor(),
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
