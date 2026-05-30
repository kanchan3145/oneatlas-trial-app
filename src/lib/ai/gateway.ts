import { GoogleGenerativeAI } from "@google/generative-ai";

type GatewayRequest = {
  provider: string;
  model: string;
  system: string;
  prompt: string;
};

export async function callAI(req: GatewayRequest): Promise<string> {
  if (req.provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in .env.local");
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: req.model });

    const result = await model.generateContent(`${req.system}\n\n${req.prompt}`);
    return result.response.text();
  }

  throw new Error(`Unsupported provider: ${req.provider}`);
}
