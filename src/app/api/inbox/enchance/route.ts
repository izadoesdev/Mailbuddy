import index from "@/app/(dev)/ai/new";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const openRouter = index.openrouter;

/**
 * POST handler for enhancing email drafts that users are typing
 */
export async function POST(request: NextRequest) {
    // Authenticate the request
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Parse request body
        const { emailContent, streaming = false, action = "improve" } = await request.json();

        if (!emailContent) {
            return NextResponse.json(
                { error: "Missing required field: emailContent" },
                { status: 400 },
            );
        }

        // Build prompt based on the requested action
        let prompt = "";
        switch (action) {
            case "improve":
                prompt = `Improve the following email draft to make it more professional, clear, and effective. 
                Maintain the same tone and intent but enhance clarity, structure, and impact.
                Consider the context that this is from ${session.user.email || "the sender"} to ${emailContent.match(/To: ([^\n]+)/)?.[1] || "the recipient"}.
                Keep in mind the relationship dynamic between sender and recipient when improving:

                ${emailContent}`;
                break;
            case "shorten":
                prompt = `Make this email draft more concise while preserving all key information.
                Consider the context that this is from ${session.user.email || "the sender"} to ${emailContent.match(/To: ([^\n]+)/)?.[1] || "the recipient"}.
                Maintain appropriate formality for this sender-recipient relationship:

                ${emailContent}`;
                break;
            case "formal":
                prompt = `Rewrite this email draft in a more formal and professional tone.
                Consider the context that this is from ${session.user.email || "the sender"} to ${emailContent.match(/To: ([^\n]+)/)?.[1] || "the recipient"}.
                Ensure language is appropriate for a professional business relationship:

                ${emailContent}`;
                break;
            case "friendly":
                prompt = `Rewrite this email draft to sound warmer and more personable.
                Consider the context that this is from ${session.user.email || "the sender"} to ${emailContent.match(/To: ([^\n]+)/)?.[1] || "the recipient"}.
                Make it conversational while maintaining appropriate professionalism for this relationship:

                ${emailContent}`;
                break;
            default:
                prompt = `Improve the following email draft to make it more professional, clear, and effective.
                Consider the context that this is from ${session.user.email || "the sender"} to ${emailContent.match(/To: ([^\n]+)/)?.[1] || "the recipient"}:

                ${emailContent}`;
        }

        if (streaming) {
            // Set up streaming response
            const encoder = new TextEncoder();
            const stream = new TransformStream();
            const writer = stream.writable.getWriter();

            // Create a streaming response
            const response = new Response(stream.readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });

            // Process in background
            (async () => {
                try {
                    const completion = await openRouter.chat.completions.create({
                        model: "google/gemini-1.5-flash",
                        messages: [{ role: "user", content: prompt }],
                        stream: true,
                    });

                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            await writer.write(
                                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                            );
                        }
                    }

                    await writer.write(
                        encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
                    );
                } catch (error) {
                    console.error("Error streaming AI response:", error);
                    await writer.write(
                        encoder.encode(
                            `data: ${JSON.stringify({ error: "Enhancement failed" })}\n\n`,
                        ),
                    );
                } finally {
                    await writer.close();
                }
            })();

            return response;
        }

        // Handle non-streaming response
        const completion = await openRouter.chat.completions.create({
            model: "google/gemini-flash-1.5-8b",
            messages: [{ role: "user", content: prompt }],
        });

        const enhancedContent = completion.choices[0]?.message?.content || "";

        return NextResponse.json({
            success: true,
            enhancedContent,
            originalContent: emailContent,
        });
    } catch (error) {
        console.error("Error enhancing email draft:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred" },
            { status: 500 },
        );
    }
}
