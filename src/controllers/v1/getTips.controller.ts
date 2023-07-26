import { logger } from '../../utils/logger';
import { bitfinexStream } from '../..';
import { Request, Response } from 'express';

export const getTips = async (req: Request, res: Response) => {
    try {
        if (!bitfinexStream.isOnline()) {
            return res.status(500).json({ error: 'Bitfinex stream is offline' });
        }

        if (!req.query.pair) {
            return res.status(400).json({ error: 'Pair is required' });
        }

        const symbol = `t${String(req.query.pair).toUpperCase()}`;
        const book = bitfinexStream.books[symbol];
        const bookSnapshots = bitfinexStream.booksSnapshots[symbol];

        if (!book || !bookSnapshots) {
            return res.status(400).json({ error: 'Pair is not supported' });
        }

        const bestBidPrice = bookSnapshots.bids[0];
        const bestAskPrice = bookSnapshots.asks[0];

        const tips = {
            bid: book.bids[bestBidPrice],
            ask: book.asks[bestAskPrice]
        };

        return res.status(200).json({ data: tips });
    } catch (err: any) {
        logger.error(`Caught error: ${err.stack}.`, 'getTips controller');
        return res.status(500).json({ error: err.message });
    }
};
