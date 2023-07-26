import { logger } from '../../utils/logger';
import { bitfinexStream } from '../..';
import { getEffectivePrice, getMaxOrderSize } from '../../utils/marketDepth';
import { Request, Response } from 'express';

type queryParams = {
    asd: number,
    pair: string
    side: 'BUY' | 'SELL'
    amount: string
    limitPrice?: string
}

export const evaluateMarket = async (req: Request<{}, {}, {}, queryParams>, res: Response) => {
    try {
        const { pair, side, amount, limitPrice } = req.query;
        const sideLowerCase = String(side).toLowerCase();
        const amountFloat = parseFloat(amount);
        const limitPriceFloat = parseFloat(limitPrice || '');

        if (sideLowerCase !== 'buy' && sideLowerCase !== 'sell') {
            return res.status(400).json({ error: 'Invalid or missing side field' });
        }

        if (isNaN(amountFloat) || amountFloat < 0) {
            return res.status(400).json({ error: 'Invalid or missing amount field' });
        }

        const bookSide = sideLowerCase === 'buy' ? 'bids' : 'asks';
        const book = bitfinexStream.books[`t${String(pair).toUpperCase()}`];
        const bookSnapshot = bitfinexStream.booksSnapshots[`t${String(pair).toUpperCase()}`];

        if (!book || !bookSnapshot) {
            return res.status(400).json({ error: 'Invalid or missing pair field' });
        }

        let data: { effectivePrice: number, maxOrderSize?: number } = {
            effectivePrice: getEffectivePrice(amountFloat, book[bookSide], bookSnapshot[bookSide])
        };

        if (!isNaN(limitPriceFloat) && limitPriceFloat > 0) {
            data = {
                ...data,
                maxOrderSize: getMaxOrderSize(limitPriceFloat, book[bookSide], bookSnapshot[bookSide])
            };
        }
        return res.status(200).json({ data });
    } catch (err: any) {
        logger.error(`Caught error: ${err.stack}.`, 'evaluateMarket controller');
        return res.status(500).json({ error: err.message });
    }
};
