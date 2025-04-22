import { app } from "@azure/functions";

app.http("hello", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get("name") || "world";

    return {
      body: `Hello, ${name}!`,
      headers: {
        "Content-Type": "text/plain",
      },
    };
  },
});
