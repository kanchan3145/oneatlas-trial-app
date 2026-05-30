import { callAI } from "@/src/lib/ai/gateway";
import { routingConfig } from "@/src/lib/ai/routing-config";
import { extractJson } from "@/src/lib/utils/json";

export async function runPipeline(prompt: string) {
  const start = Date.now();
  const route = routingConfig.appspec.primary;

  const output = await callAI({
    provider: route.provider,
    model: route.model,
    system: `
Return ONLY valid JSON.

Generate:
{
  "intent": {},
  "dataSchema": { "entities": [] },
  "appSpec": {
    "pages": [],
    "apiEndpoints": [],
    "authRules": { "roles": [], "permissionMatrix": {} },
    "integrationHooks": [],
    "workflowStubs": []
  }
}

Do not omit dataSchema.entities.
`,
    prompt,
  });

  const parsed: any = extractJson(output);

  return normalizeResult({
    success: true,
    mode: "ai",
    latencyMs: Date.now() - start,
    prompt,
    intent: parsed.intent ?? {},
    dataSchema: parsed.dataSchema ?? { entities: [] },
    appSpec: parsed.appSpec ?? {},
  });
}

function inferAppType(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("task") || p.includes("project")) return "project_management";
  if (p.includes("order") || p.includes("stripe") || p.includes("ecommerce") || p.includes("e-commerce")) return "ecommerce";
  if (p.includes("employee") || p.includes("leave") || p.includes("hr")) return "hr_tool";
  if (p.includes("stock") || p.includes("inventory") || p.includes("warehouse")) return "inventory";
  if (p.includes("lead") || p.includes("deal") || p.includes("crm")) return "crm";
  return "custom";
}

function createField(name: string, type = "string") {
  return {
    name,
    type,
    nullable: false,
    isRelation: false,
    isPrimary: name === "id",
    isUnique: name === "id",
  };
}


function toTableName(name: string) {
  return (
    String(name)
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/\s+/g, "_")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "") + "s"
  );
}

function createEntity(name: string, fields: string[]) {
  return {
    name,
    tableName: name.toLowerCase() + "s",
    fields: [
      createField("id"),
      createField("tenantId"),
      ...fields.map((f) => createField(f)),
    ],
    relations: [],
  };
}

function fallbackEntities(prompt: string) {
  const type = inferAppType(prompt);

  if (type === "inventory") {
    return [
      createEntity("Product", ["name", "sku", "quantity", "lowStockThreshold"]),
      createEntity("StockMovement", ["type", "quantity", "reason"]),
      createEntity("Supplier", ["name", "email", "phone"]),
    ];
  }

  if (type === "ecommerce") {
    return [
      createEntity("Product", ["name", "price", "stock"]),
      createEntity("Order", ["status", "totalAmount"]),
      createEntity("Customer", ["name", "email"]),
      createEntity("Payment", ["amount", "status", "stripePaymentId"]),
    ];
  }

  if (type === "project_management") {
    return [
      createEntity("Task", ["title", "dueDate", "priority", "status"]),
      createEntity("TeamMember", ["name", "email"]),
    ];
  }

  if (type === "hr_tool") {
    return [
      createEntity("Employee", ["name", "email", "role"]),
      createEntity("LeaveRequest", ["status", "startDate", "endDate"]),
      createEntity("PerformanceReview", ["rating", "notes"]),
    ];
  }

  return [
    createEntity("Lead", ["name", "phone", "status"]),
    createEntity("Deal", ["status", "value"]),
  ];
}

function normalizeField(field: any) {
  return {
    name: field.name ?? "field",
    type: field.type ?? "string",
    nullable: field.nullable ?? false,
    isRelation: field.isRelation ?? false,
    isPrimary: field.isPrimary ?? field.name === "id",
    isUnique: field.isUnique ?? field.name === "id",
  };
}

function normalizeEntity(entity: any) {
  const name = entity.name ?? entity.entityName ?? entity.id ?? "Entity";

  const fallbackFieldMap: Record<string, string[]> = {
    Product: ["name", "sku", "quantity", "lowStockThreshold"],
    StockMovement: ["type", "quantity", "reason"],
    Supplier: ["name", "email", "phone"],
    LowStockAlert: ["threshold", "message", "sentAt"],
    Task: ["title", "dueDate", "priority", "status"],
    TeamMember: ["name", "email"],
    TeamLead: ["name", "email", "slackId"],
    Employee: ["name", "email", "role"],
    LeaveRequest: ["status", "startDate", "endDate"],
    PerformanceReview: ["rating", "notes"],
    Order: ["status", "totalAmount"],
    Customer: ["name", "email"],
    Payment: ["amount", "status", "stripePaymentId"],
    Lead: ["name", "phone", "status"],
    Deal: ["status", "value"],
  };

  let fields = Array.isArray(entity.fields)
    ? entity.fields.map(normalizeField)
    : [];

  const requiredFields = ["id", "tenantId", ...(fallbackFieldMap[name] ?? [])];

  for (const fieldName of requiredFields) {
    if (!fields.some((f: any) => f.name === fieldName)) {
      fields.push(createField(fieldName));
    }
  }

  fields = fields.sort((a: any, b: any) => {
    if (a.name === "id") return -1;
    if (b.name === "id") return 1;
    if (a.name === "tenantId") return -1;
    if (b.name === "tenantId") return 1;
    return 0;
  });

  return {
    name,
    tableName: entity.tableName ?? toTableName(name),
    fields,
    relations: Array.isArray(entity.relations) ? entity.relations : [],
  };
}
function normalizeResult(result: any) {
  const appType = inferAppType(result.prompt);

  result.intent = {
    appName: result.intent?.appName ?? "Generated App",
    appType,
    features: result.intent?.features ?? [],
    entities: result.intent?.entities ?? [],
    integrations_requested: result.intent?.integrations_requested ?? [],
    assumptions: result.intent?.assumptions ?? [],
  };

  let entities = Array.isArray(result.dataSchema?.entities)
    ? result.dataSchema.entities
    : [];

  if (entities.length === 0) {
    entities = fallbackEntities(result.prompt);
  }

  result.dataSchema = {
    entities: entities.map(normalizeEntity),
  };

  const firstEntity = result.dataSchema.entities[0]?.name ?? "Entity";

  result.appSpec.pages = Array.isArray(result.appSpec.pages)
    ? result.appSpec.pages.map((page: any) => {
        const pageName = String(page.name ?? "").toLowerCase();

        let matchedEntity = page.boundEntity ?? firstEntity;

        for (const entity of result.dataSchema.entities) {
          if (pageName.includes(entity.name.toLowerCase())) {
            matchedEntity = entity.name;
          }
        }

        return {
          name: page.name ?? `${matchedEntity} List`,
          route: page.route ?? `/${String(matchedEntity).toLowerCase()}s`,
          layout: page.layout ?? "list",
          boundEntity: matchedEntity,
          components: Array.isArray(page.components)
            ? page.components
                .map((component: any) =>
                  typeof component === "string" ? component : component.type
                )
                .filter(Boolean)
            : ["table"],
        };
      })
    : [
        {
          name: `${firstEntity} List`,
          route: `/${String(firstEntity).toLowerCase()}s`,
          layout: "list",
          boundEntity: firstEntity,
          components: ["table", "form"],
        },
      ];  
  result.appSpec.apiEndpoints = Array.isArray(result.appSpec?.apiEndpoints)
    ? result.appSpec.apiEndpoints.map((api: any) => ({
        path: api.path ?? api.route ?? `/api/${firstEntity.toLowerCase()}s`,
        method: api.method ?? "GET",
        handlerDescription: api.handlerDescription ?? api.description ?? "Generated endpoint",
        boundEntity: api.boundEntity ?? firstEntity,
        authRequired: api.authRequired ?? true,
        rateLimit: api.rateLimit ?? true,
      }))
    : [];

  for (const page of result.appSpec.pages) {
    const hasApi = result.appSpec.apiEndpoints.some((api: any) => api.boundEntity === page.boundEntity);

    if (!hasApi) {
      result.appSpec.apiEndpoints.push({
        path: `/api/${String(page.boundEntity).toLowerCase()}s`,
        method: "GET",
        handlerDescription: `List ${page.boundEntity}`,
        boundEntity: page.boundEntity,
        authRequired: true,
        rateLimit: true,
      });
    }
  }

  result.appSpec.authRules = {
    roles: Array.isArray(result.appSpec?.authRules?.roles)
      ? result.appSpec.authRules.roles.map((r: any) => typeof r === "string" ? r : r.name)
      : ["admin", "user"],
    permissionMatrix: result.appSpec?.authRules?.permissionMatrix ?? {},
  };

  result.appSpec.integrationHooks = Array.isArray(result.appSpec?.integrationHooks)
    ? result.appSpec.integrationHooks.map((hook: any) => ({
        integration: hook.integration ?? hook.type ?? "gmail",
        trigger: hook.trigger ?? hook.event ?? "record_event",
        action: hook.action ?? "send_email",
      }))
    : [];

  result.appSpec.workflowStubs = Array.isArray(result.appSpec?.workflowStubs)
    ? result.appSpec.workflowStubs.map((workflow: any) => ({
        name: workflow.name ?? "Generated Workflow",
        trigger: typeof workflow.trigger === "object"
          ? workflow.trigger
          : { entity: firstEntity, event: "status_changed", condition: String(workflow.trigger ?? "condition_met") },
        integration: workflow.integration ?? "gmail",
        action: workflow.action ?? "send_email",
        payload: workflow.payload ?? {},
      }))
    : [];

  return result;
}


