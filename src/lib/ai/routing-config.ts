export const routingConfig = {
  intent: {
    primary: { provider: "groq", model: "llama-3.1-8b-instant" }
  },
  schema: {
    primary: { provider: "groq", model: "llama-3.3-70b-versatile" }
  },
  appspec: {
    primary: { provider: "groq", model: "llama-3.3-70b-versatile" }
  }
};
