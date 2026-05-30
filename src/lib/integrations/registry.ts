export const integrationRegistry = [
  { id: "slack", displayName: "Slack", authType: "oauth2", actions: [{ id: "send_channel_message" }, { id: "send_dm" }] },
  { id: "whatsapp", displayName: "WhatsApp", authType: "api_key", actions: [{ id: "send_template_message" }] },
  { id: "gmail", displayName: "Gmail", authType: "oauth2", actions: [{ id: "send_email" }] },
  { id: "stripe", displayName: "Stripe", authType: "api_key", actions: [{ id: "create_customer" }, { id: "charge_customer" }] },
  { id: "jira", displayName: "Jira", authType: "oauth2", actions: [{ id: "create_issue" }] }
];
