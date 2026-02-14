import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Martillo API',
      version: '0.1.0',
      description: 'Documentacion base de endpoints y eventos del MVP Martillo.',
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/auth.routes.ts'),
    path.join(__dirname, '../routes/auction.routes.ts'),
    path.join(__dirname, '../routes/payment.routes.ts'),
    path.join(__dirname, '../socket/docs.ts'),
  ],
};

export function applySwagger(app: Express): void {
  const openApiSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}
