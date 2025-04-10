'use server'

import { pipeline } from '@xenova/transformers';
import { convert } from 'html-to-text';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

let classifier: any;

async function getClassifier() {
    if (!classifier) {
        classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall');
    }
    return classifier;
}

export async function categorizeEmail(email: string) {
    const classifier = await getClassifier();
    const text = convert(email);
    const output = await classifier(text, ['Work', 'Scheduling', 'Invoices', 'Customer Support', 'Other', 'Spam', 'Social', 'Updates', 'Promotions', 'Newsletters', 'Receipts', 'Shipping', 'Refunds', 'Returns', 'Payments', 'Alerts', 'Security', 'Privacy', 'Legal', 'Other', 'Marketing', 'Sales', 'Support', 'Technical', 'Other']);
    console.log(`Categorizing email: ${email}\n${JSON.stringify(output, null, 2)}`);
    return output;
}