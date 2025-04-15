import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedRoutes = ["/inbox", "/profile", "/calendar", "/contacts"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
        return NextResponse.next();
    }

    const session = getSessionCookie(request);
    if (protectedRoutes.includes(pathname) && !session && !authRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();

}
