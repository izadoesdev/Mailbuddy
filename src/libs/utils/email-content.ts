/**
 * Decodes base64 content
 * @param data Base64 encoded data
 * @returns Decoded string
 */
export function decodeBase64(data: string): string {
    return Buffer.from(data, "base64").toString();
}

/**
 * Extracts text and HTML content from email payload
 * @param payload The email payload from Gmail API
 * @returns Object containing text and HTML content
 */
export function extractContentFromParts(payload: any): { text: string; html: string } {
    const result = { text: "", html: "" };

    if (!payload.parts) {
        // Handle single part messages
        if (payload.body?.data) {
            const content = decodeBase64(payload.body.data);
            if (payload.mimeType === "text/plain") {
                result.text = content;
            } else if (payload.mimeType === "text/html") {
                result.html = content;
            }
        }
        return result;
    }

    // Process all parts recursively
    for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
            result.text = decodeBase64(part.body.data);
        } else if (part.mimeType === "text/html" && part.body && part.body.data) {
            result.html = decodeBase64(part.body.data);
        } else if (part.parts) {
            // Recursively process nested parts
            const nestedContent = extractContentFromParts(part);
            if (nestedContent.text) result.text = nestedContent.text;
            if (nestedContent.html) result.html = nestedContent.html;
        }
    }

    return result;
}
