"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        refetchOnMount: false,
                        refetchOnReconnect: false,
                    },
                },
            }),
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
