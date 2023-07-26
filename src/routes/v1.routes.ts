import { Router } from 'express';
import { getTips, evaluateMarket, getOrderBook, getTicker } from '../controllers/v1/index';

export const router = Router();

/**
 * @swagger
 * /ticker:
 *  get:
 *      summary: Get ticker for a given pair name
 *      description: Returns the last highest bid and ask prices, and the sum of the 25 highest sizes, for a given pair name
 *      tags: [Ticker]
 *      parameters:
 *          - in: query
 *            name: pair
 *            schema:
 *              type: string
 *            required: true
 *            description: Pair name
 *            example:
 *              BTCUSD
 *      responses:
 *          200:
 *              description: Success
 *          400:
 *              description: Bad request
 *          500:
 *              description: Internal server error
 */
router.get('/ticker', getTicker);

/**
 * @swagger
 * /tips:
 *  get:
 *      summary: Get tips for a given pair name
 *      description: Returns tips for a given pair name
 *      tags: [Market depth]
 *      parameters:
 *          - in: query
 *            name: pair
 *            schema:
 *              type: string
 *            required: true
 *            description: Pair name
 *            example:
 *              BTCUSD
 *      responses:
 *          200:
 *              description: Success
 *          400:
 *              description: Bad request
 *          500:
 *              description: Internal server error
 */
router.get('/tips', getTips);

/**
 * @swagger
 * /evaluate:
 *  get:
 *      summary: Evaluates market depth
 *      description: Evaluates market depth and returns the effective price that will result if the order is executed.
 *      tags: [Market depth]
 *      parameters:
 *          - in: query
 *            name: pair
 *            schema:
 *              type: string
 *            required: true
 *            description: Pair name
 *            example:
 *              BTCUSD
 *          - in: query
 *            name: side
 *            schema:
 *              type: string
 *            required: true
 *            description: Order side
 *            example:
 *              buy
 *          - in: query
 *            name: amount
 *            schema:
 *              type: number
 *            required: true
 *            description: Order size
 *            example:
 *              1.33
 *          - in: query
 *            name: limitPrice
 *            schema:
 *              type: number
 *            required: false
 *            description: Limit effective price
 *      responses:
 *          200:
 *              description: Success
 *          400:
 *              description: Bad request
 *          500:
 *              description: Internal server error
 */
router.get('/evaluate', evaluateMarket);

/**
 * @swagger
 * /orderbook:
 *  get:
 *      summary: Get the order book of a given pair name
 *      description: Returns the order book of a given pair name
 *      tags: [Order Book]
 *      parameters:
 *          - in: query
 *            name: pair
 *            schema:
 *              type: string
 *            required: true
 *            description: Pair name
 *            example:
 *              BTCUSD
 *      responses:
 *          200:
 *              description: Success
 *          400:
 *              description: Bad request
 *          500:
 *              description: Internal server error
 */
router.get('/orderbook', getOrderBook);
