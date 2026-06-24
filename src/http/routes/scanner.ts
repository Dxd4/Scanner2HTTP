import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AbortError } from '../../errors/AbortError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { SerialError } from '../../errors/SerialError.js';
import { SessionError } from '../../errors/SessionError.js';
import { TimeoutError } from '../../errors/TimeoutError.js';
import { IScannerManager } from '../../scanner/interfaces/IScannerManager.js';
import {
  PollParamsSchema,
  PollQuerySchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  ScannersResponseSchema,
} from './schema.js';

function scannerRoutes(app: FastifyInstance, manager: IScannerManager) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/scanners/:id/poll',
    {
      schema: {
        params: PollParamsSchema,
        querystring: PollQuerySchema,
        response: {
          200: SuccessResponseSchema,
          default: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { lockState, timeout } = request.query;

      try {
        const result = await manager.startScan(
          id,
          lockState,
          timeout,
          request.signal,
        );
        reply.status(200).send(result);
      } catch (err) {
        if (err instanceof TimeoutError) {
          reply.status(408).send({ status: 'error', message: err.message });
        } else if (err instanceof AbortError) {
          reply.status(409).send({ status: 'error', message: err.message });
        } else if (err instanceof NotFoundError) {
          reply.status(404).send({ status: 'error', message: err.message });
        } else if (err instanceof SerialError) {
          reply.status(503).send({ status: 'error', message: err.message });
        } else if (err instanceof SessionError) {
          reply.status(503).send({ status: 'error', message: err.message });
        } else if (err instanceof Error) {
          reply.status(500).send({ status: 'error', message: err.message });
        } else {
          reply
            .status(500)
            .send({ status: 'error', message: 'Internal server error' });
        }
      }
    },
  );

  app.withTypeProvider().get(
    '/scanners',
    {
      schema: {
        response: {
          200: ScannersResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const list = manager.scanners.map((scanner) => ({
        id: scanner.id,
        path: scanner.portInfo.path,
        vendorId: scanner.config.vendorId,
        productId: scanner.config.productId,
      }));

      return reply.send(list);
    },
  );
}

export default scannerRoutes;
