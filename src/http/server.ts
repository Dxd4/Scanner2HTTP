import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { ScannerManager } from '../scanner/ScannerManager.js';
import scannerRoutes from './routes/scanner.js';

class HTTPServer {
  private fastify: FastifyInstance;
  private manager: ScannerManager;
  public readonly host: string;
  public readonly port: number;

  constructor(
    manager: ScannerManager,
    host: string = 'localhost',
    port: number = 55100,
  ) {
    this.host = host;
    this.port = port;

    this.fastify = Fastify({
      logger: false,
    }).withTypeProvider<ZodTypeProvider>();

    this.manager = manager;
  }

  public async start() {
    const shutdown = async () => {
      await this.close();
      process.exit(0);
    };

    process.on('SIGINT', () => void shutdown());
    process.on('SIGTERM', () => void shutdown());

    this.fastify.setValidatorCompiler(validatorCompiler);
    this.fastify.setSerializerCompiler(serializerCompiler);

    if (process.env.NODE_ENV !== 'production') {
      await this.swaggerInit(this.fastify);
    }

    this.fastify.register(scannerRoutes, this.manager);
    await this.manager.init();

    await this.fastify.listen({ host: this.host, port: this.port });
    this.fastify.log.info(`Scanner2HTTP started...`);
  }

  public async close() {
    await this.fastify.close();
  }

  async swaggerInit(app: FastifyInstance) {
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Scanner2HTTP API',
          version: '1.0.0',
        },
      },
      transform: jsonSchemaTransform,
    });
    await app.register(fastifySwaggerUi, { routePrefix: '/docs' });
  }
}

export default HTTPServer;
