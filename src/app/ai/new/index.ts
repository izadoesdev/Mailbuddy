import { Index } from "@upstash/vector";
import env from "@/libs/env";
import Groq from "groq-sdk";

const index = new Index({
    url: env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 30000,
    maxRetries: 3,
});

export default { index, groq };