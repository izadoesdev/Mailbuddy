import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";
import { customSessionClient } from "better-auth/client/plugins";

export type AuthClientConfig = {
    baseURL?: string;
    debug?: boolean;
};

// Default configuration that can be overridden
const defaultConfig: AuthClientConfig = {
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string,
    debug: process.env.NODE_ENV !== "production",
};

// Create a singleton instance with the default configuration
let _authClient = createAuthClient({
    baseURL: defaultConfig.baseURL,
    plugins: [customSessionClient<typeof auth>()],
});

// Function to initialize or reconfigure the auth client
export function initAuthClient(config: AuthClientConfig = {}) {
    const mergedConfig = { ...defaultConfig, ...config };

    _authClient = createAuthClient({
        baseURL: mergedConfig.baseURL,
        plugins: [customSessionClient<typeof auth>()],
    });

    return _authClient;
}

// Export the auth client instance
export const authClient = _authClient;

// Export individual functions directly from the client
// These are properly typed and will be available for import
export const signIn = _authClient.signIn;
export const signUp = _authClient.signUp;
export const signOut = _authClient.signOut;
export const useSession = _authClient.useSession;
export const getSession = _authClient.getSession;

export function useUser() {
    const { data, isPending, error } = useSession();

    return {
        user: data?.user,
        isLoading: isPending,
        error,
    };
}
