export async function runPipeline(prompt: string) {
  return {
    success: true,
    latencyMs: 120,
    mode: "mock",
    prompt,
    intent: {
      appName: "CRM App",
      appType: "crm",
      features: ["Lead management", "Deal tracking", "Agent dashboard"],
      entities: ["Lead", "Agent", "Deal"],
      integrations_requested: ["whatsapp"],
      assumptions: ["Mock output used because Gemini quota is exceeded"]
    },
    dataSchema: {
      entities: [
        {
          name: "Lead",
          tableName: "leads",
          fields: [
            { name: "id", type: "string", nullable: false, isRelation: false, isPrimary: true, isUnique: true },
            { name: "tenantId", type: "string", nullable: false, isRelation: false, isPrimary: false, isUnique: false },
            { name: "name", type: "string", nullable: false, isRelation: false, isPrimary: false, isUnique: false }
          ],
          relations: []
        }
      ]
    },
    appSpec: {
      pages: [
        { name: "Leads", route: "/leads", layout: "list", boundEntity: "Lead", components: ["table", "form"] }
      ],
      apiEndpoints: [
        { path: "/api/leads", method: "GET", handlerDescription: "List all leads", boundEntity: "Lead", authRequired: true, rateLimit: true }
      ],
      authRules: {
        roles: ["admin", "agent"],
        permissionMatrix: {}
      },
      integrationHooks: [
        { integration: "whatsapp", trigger: "status_changed", action: "send_template_message" }
      ],
      workflowStubs: [
        {
          name: "Send WhatsApp notification when deal closes",
          trigger: { entity: "Lead", event: "status_changed", condition: "status === 'closed'" },
          integration: "whatsapp",
          action: "send_template_message",
          payload: { phone: "lead.phone", template: "deal_closed" }
        }
      ]
    }
  };
}
