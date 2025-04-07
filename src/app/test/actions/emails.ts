"use server";

import { google } from "googleapis";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";

async function getUser() {
    const session = await auth.api.getSession({headers: await headers()})
    if (!session) {
        return {
            error: "User not found"
        }
    }
    return session
}

export async function getEmails() {
    const session = await getUser()
    if ('error' in session) {
        return {
            error: session.error
        }
    }
    
    if (!session.user.accessToken) {
        return {
            error: "Access token not available"
        }
    }
    
    try {
        const gmail = google.gmail({ version: "v1", auth: session.user.accessToken })
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: session.user.accessToken });
        const response = await gmail.users.messages.list({ userId: session.user.email, auth: oauth2Client })
        return response.data
    } catch (error: any) {
        
        // Handle specific error cases
        if (error.status === 401) {
            return {
                error: "Authentication failed. Your session may have expired. Please log out and log in again."
            }
        }
        
        return {
            error: "Failed to fetch emails. Please try again later."
        }
    }
}
