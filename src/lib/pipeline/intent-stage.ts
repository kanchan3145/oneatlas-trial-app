import { callAI } from "@/src/lib/ai/gateway";
import { routingConfig } from "@/src/lib/ai/routing-config";
import { extractJson } from "@/src/lib/utils/json";
import { AppIntentSchema } from "@/src/lib/validation/schemas";

export async function runIntentStage(prompt: string) {
  const route = routingConfig.intent.primary;

  const system = `
Return ONLY JSON.
Extract app intent:
{
  "appName": string,
  "appType": "crm" | "project_management" | "ecommerce" | "hr_tool" | "inventory" | "content_platform" | "analytics" | "custom",
  "features": string[],
  "entities": string[],
  "integrations_requested": string[],
  "assumptions": string[]
}
`;

  const output = await callAI({
    provider: route.provider,
    model: route.model,
    system,
    prompt
  });

  return AppIntentSchema.parse(extractJson(output));
}
