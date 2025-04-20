// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: [
                "/",
                // '/inbox',
                "/settings",
                "/privacy",
                "/terms",
                "/features",
                "/pricing",
                "/blog",
                "/contact",
                "/help",
                // '/login',
                // '/register',
                "/api",
                "/api/*",
            ],
            disallow: [
                "/api/*", // API routes
                "/_next/*", // Next.js internals
                "/static/*", // Static files
                "/auth/*", // Authentication routes
                "/inbox", // Raw email content
                "/inbox/*", // Email attachments
            ],
        },
        sitemap: "https://mailbuddy.app/sitemap.xml",
    };
}
