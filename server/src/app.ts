import Fastify from "fastify";
import { YahooClient } from "./clients/yahooClient.js";
import { SymbolNotFoundError, UpstreamError } from "./errors.js";
import { ChartService } from "./services/chartService.js";

interface AppOptions {
  chartService?: ChartService;
}

export function buildApp({ chartService }: AppOptions = {}) {
  const app = Fastify({ logger: true });
  const charts = chartService ?? new ChartService(new YahooClient(app.log));

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof SymbolNotFoundError) {
      return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
    }
    if (error instanceof UpstreamError) {
      request.log.error(error);
      return reply
        .code(502)
        .send({ statusCode: 502, error: "Bad Gateway", message: "Upstream request failed" });
    }
    throw error;
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.get<{ Params: { symbol: string } }>(
    "/api/stocks/:symbol/daily",
    {
      schema: {
        params: {
          type: "object",
          required: ["symbol"],
          properties: {
            symbol: { type: "string", minLength: 1, maxLength: 15 },
          },
        },
      },
    },
    async (request) => charts.getDailySummaries(request.params.symbol),
  );

  return app;
}
