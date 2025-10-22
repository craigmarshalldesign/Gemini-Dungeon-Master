import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Please set it in your environment.");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
