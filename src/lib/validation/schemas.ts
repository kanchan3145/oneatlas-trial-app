import { z } from "zod";

export const AppIntentSchema = z.object({
  appName: z.string(),
  appType: z.enum(["crm", "project_management", "ecommerce", "hr_tool", "inventory", "content_platform", "analytics", "custom"]),
  features: z.array(z.string()),
  entities: z.array(z.string()),
  integrations_requested: z.array(z.string()),
  assumptions: z.array(z.string())
});

export const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "date", "enum", "json"]),
  nullable: z.boolean(),
  isRelation: z.boolean(),
  isPrimary: z.boolean(),
  isUnique: z.boolean()
});

export const EntitySchema = z.object({
  name: z.string(),
  tableName: z.string(),
  fields: z.array(FieldSchema),
  relations: z.array(z.object({
    type: z.enum(["hasMany", "belongsTo", "hasOne"]),
    target: z.string(),
    foreignKey: z.string(),
    onDelete: z.enum(["cascade", "restrict", "setNull"])
  }))
});

export const DataSchemaSchema = z.object({
  entities: z.array(EntitySchema)
});

export const AppSpecSchema = z.object({
  pages: z.array(z.object({
    name: z.string(),
    route: z.string(),
    layout: z.enum(["list", "detail", "dashboard", "settings"]),
    boundEntity: z.string(),
    components: z.array(z.enum(["table", "form", "chart", "card"]))
  })),

  apiEndpoints: z.array(z.object({
    path: z.string(),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    handlerDescription: z.string(),
    boundEntity: z.string(),
    authRequired: z.boolean(),
    rateLimit: z.boolean()
  })),

  authRules: z.object({
    roles: z.array(z.string()),
    permissionMatrix: z.record(z.string(), z.any())
  }),

  integrationHooks: z.array(z.object({
    integration: z.string(),
    trigger: z.string(),
    action: z.string()
  })),

  workflowStubs: z.array(z.object({
    name: z.string(),
    trigger: z.object({
      entity: z.string(),
      event: z.enum(["created", "updated", "deleted", "status_changed"]),
      condition: z.string().optional()
    }),
    integration: z.string(),
    action: z.string(),
    payload: z.record(z.string(), z.string())
  }))
});

export type AppIntent = z.infer<typeof AppIntentSchema>;
export type DataSchema = z.infer<typeof DataSchemaSchema>;
export type AppSpec = z.infer<typeof AppSpecSchema>;
