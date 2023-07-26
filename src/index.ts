import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { PORT, BITFINEX_CONFIG } from './config';
import { v1Router } from './routes/index';
import swaggerUi from 'swagger-ui-express';
import swaggerJSdoc from 'swagger-jsdoc';
import { BitfinexStream } from './services/bitfinexStream.service';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/v1', v1Router);

// Swagger
const swaggerConfig = {
    apis: [ './src/routes/*.ts' ],
    definition: {
        openapi: '3.0.0',
        servers: [ {
            url: '/v1'
        } ],
        info: {
            title: 'Membrane API',
            version: '1.0.0',
            description: 'A public API REST that retrieves market information for trading pairs.'
        }
    }
};
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerJSdoc(swaggerConfig)));

// Data streams
export const bitfinexStream = new BitfinexStream(BITFINEX_CONFIG);

// Server
export const server = createServer(app);

const onError = (error: any) => {
    switch (error.code) {
    case 'EACCES':
        logger.error(`Port ${PORT} cannot be accessed`);
        process.exit(1);
        break;
    case 'EADDRINUSE':
        logger.error(`Port ${PORT} already in use`);
        process.exit(1);
        break;
    default:
        throw error;
    }
};

const onListening = () => {
    logger.info(`Server is running on port ${PORT}`);
};

server.on('error', onError);
server.on('listening', onListening);
server.listen(PORT);
