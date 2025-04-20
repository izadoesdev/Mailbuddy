import {
    customSessionClient,
    emailOTPClient,
    magicLinkClient,
    multiSessionClient,
    twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

// Create a singleton instance with the default configuration
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string,
    plugins: [
        customSessionClient<typeof auth>(),
        multiSessionClient(),
        emailOTPClient(),
        magicLinkClient(),
        twoFactorClient(),
    ],
});

export const { useSession, signIn, signUp, signOut, getSession } = authClient;

export function useUser() {
    const { data, isPending, error } = useSession();

    return {
        user: data?.user,
        isLoading: isPending,
        error,
    };
}
