if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
} as const; 