import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const WISHLIST_AUDIENCE_ID = process.env.RESEND_WISHLIST_AUDIENCE_ID || "";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email address" },
                { status: 400 },
            );
        }

        try {
            const checkResponse = await resend.contacts.list({
                audienceId: WISHLIST_AUDIENCE_ID,
            });

            const emailExists = checkResponse.data?.data?.some(
                (contact: any) => contact.email?.toLowerCase() === email.toLowerCase(),
            );

            if (emailExists) {
                return NextResponse.json({
                    success: true,
                    message: "You're already on our wishlist!",
                });
            }
        } catch (error) {
            // Continue with create flow if check fails
        }

        const response = await resend.contacts.create({
            email,
            unsubscribed: false,
            audienceId: WISHLIST_AUDIENCE_ID,
        });

        if ("error" in response && response.error) {
            if (response.error?.message?.includes("already exists")) {
                return NextResponse.json({
                    success: true,
                    message: "You're already on our wishlist!",
                });
            }

            throw new Error(response.error?.message || "Unknown error");
        }

        return NextResponse.json({
            success: true,
            message: "Successfully added to wishlist",
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
}

export async function GET() {
    try {
        const response = await resend.contacts.list({ audienceId: WISHLIST_AUDIENCE_ID });
        const count = response.data?.data?.length || 0;

        return NextResponse.json({
            success: true,
            data: { count },
        });
    } catch (error) {
        return NextResponse.json({
            success: true,
            data: { count: 0 },
            fallback: true,
        });
    }
}
