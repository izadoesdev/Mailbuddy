import json from './req.json';
import { convert } from 'html-to-text';
import GPT3Tokenizer from 'gpt3-tokenizer';
import { prioritizeEmail, summarizeEmail, extractActionItems, extractContactInfo } from '../ai/new/utils/openrouter';
import { Email } from '../inbox/types';
import { processEmail } from '../ai/new/utils/openrouter';

const email = json.emails[0];

// const priority = await prioritizeEmail(email);
const summary = await processEmail(email);
// const actionItems = await extractActionItems(email);
// const contactInfo = await extractContactInfo(email);


console.log(summary);  