// import { NextResponse } from "next/server";
// import { withGmailApi } from "@/app/api/utils/withGmail";
// import type { gmail_v1 } from "googleapis";
// import { auth } from "@/libs/auth";
// import { headers } from "next/headers";

// export async function GET() {
//   try {
//     // Get the current session
//     const session = await auth.api.getSession({ headers: await headers() });
//     if (!session?.user) {
//         return new Response(JSON.stringify({ error: "Unauthorized" }), {
//             status: 401,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
//     const userId = session.user.id;
    
//     // Find the user's Google account with tokens
//     const result = await withGmailApi(
//       userId,
//       null, // Initial access token (null to force refresh)
//       null, // Refresh token (will be fetched from database)
//       async (client: gmail_v1.Gmail) => {
//         // Example: List the most recent 10 messages
//         const response = await client.users.messages.list({
//           userId: "me",
//           maxResults: 1,
//           labelIds: ["SPAM"]
//         });
        
//         return response.data;
//       }
//     );

//     if (!result || !result.messages) {
//       return NextResponse.json(
//         { error: "Failed to fetch Gmail data" },
//         { status: 500 }
//       );
//     }

//     const messageDetails: any[] = [];
    
//     // Fetch details for each message
//     for (const message of result.messages) {
//         if (message.id) {
//             const messageData = await withGmailApi(
//                 userId, 
//                 null, 
//                 null, 
//                 async (client: gmail_v1.Gmail) => {
//                     return client.users.messages.get({
//                         userId: "me",
//                         id: message.id,
//                         format: "metadata",
//                       });
//                 }
//             );
            
//             if (messageData) {
//                 messageDetails.push(messageData);
//             }
//         }
//     }

//     return NextResponse.json({ 
//         success: true, 
//         messageCount: result.messages.length,
//         messages: messageDetails
//     });
//   } catch (error: any) {
//     console.error("Gmail API test error:", error);
    
//     return NextResponse.json(
//       { 
//         error: "Error testing Gmail API", 
//         message: error.message || "Unknown error",
//         stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
//       },
//       { status: 500 }
//     );
//   }
// }

