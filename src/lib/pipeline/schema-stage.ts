import { callAI } from "@/src/lib/ai/gateway";
import { routingConfig } from "@/src/lib/ai/routing-config";
import { extractJson } from "@/src/lib/utils/json";
import { AppIntent, DataSchemaSchema } from "@/src/lib/validation/schemas";

export async function runSchemaStage(intent: AppIntent) {
  const route = routingConfig.schema.primary;

  const system = `
Return ONLY JSON.
Generate DataSchema.
Every entity must have id and tenantId fields.
Use snake_case table names.
`;

  const output = await callAI({
    provider: route.provider,
    model: route.model,
    system,
    prompt: JSON.stringify(intent)
  });

  return DataSchemaSchema.parse(extractJson(output));
}
