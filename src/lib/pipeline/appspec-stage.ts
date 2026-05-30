import { callAI } from "@/src/lib/ai/gateway";
import { routingConfig } from "@/src/lib/ai/routing-config";
import { extractJson } from "@/src/lib/utils/json";
import { AppSpecSchema, DataSchema } from "@/src/lib/validation/schemas";
import { integrationRegistry } from "@/src/lib/integrations/registry";

export async function runAppSpecStage(schema: DataSchema) {
  const route = routingConfig.appspec.primary;

  const system = `
Return ONLY JSON.
Generate AppSpec with pages, apiEndpoints, authRules, integrationHooks, workflowStubs.
Every page must have a matching API endpoint.
Use only these integrations:
${JSON.stringify(integrationRegistry)}
`;

  const output = await callAI({
    provider: route.provider,
    model: route.model,
    system,
    prompt: JSON.stringify(schema)
  });

  return AppSpecSchema.parse(extractJson(output));
}
