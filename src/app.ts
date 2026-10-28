import Fastify, { type FastifyInstance } from 'fastify';

export type ReadinessDatabase = {
  query(sql: string): Promise<unknown>;
};

export function buildApp(deps: { db?: ReadinessDatabase } = {}): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get('/healthz', async () => ({ status: 'ok' }));
  app.get('/readyz', async (request, reply) => {
    void request;

    if (!deps.db) {
      return reply.code(503).send({ status: 'unavailable' });
    }

    try {
      await deps.db.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  return app;
}
