'use server'

import { categorizeEmail } from '../utils/categorize';

// Maximum concurrency to avoid overwhelming resources
const MAX_CONCURRENCY = 5;

export async function getEmailCategory(email: string) {
    const output = await categorizeEmail(email);
    return output;
}

export async function getEmailCategories(emails: string[]) {
    // Process emails in parallel with a maximum concurrency limit
    const results = [];
    
    // Process emails in batches to control concurrency
    for (let i = 0; i < emails.length; i += MAX_CONCURRENCY) {
        const batch = emails.slice(i, i + MAX_CONCURRENCY);
        const batchResults = await Promise.all(
            batch.map(email => getEmailCategory(email))
        );
        results.push(...batchResults);
    }
    
    return results;
}



