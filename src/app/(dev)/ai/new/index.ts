import env from "@/libs/env";
import { Index } from "@upstash/vector";
import Groq from "groq-sdk";
import { OpenAI } from "openai";

const index = new Index({
    url: env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
});

const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    timeout: 30000,
    maxRetries: 3,
});

// const groq = new Groq({
//     apiKey: process.env.GROQ_API_KEY,
//     timeout: 30000,
//     maxRetries: 3,
// });

export default { index, openrouter };
