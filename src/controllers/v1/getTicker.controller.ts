import { logger } from '../../utils/logger';
import { bitfinexStream } from '../..';
import { Request, Response } from 'express';

export const getTicker = async (req: Request, res: Response) => {
    try {
        if (!bitfinexStream.isOnline()) {
            return res.status(500).json({ error: 'Bitfinex stream is offline' });
        }

        if (!req.query.pair) {
            return res.status(400).json({ error: 'Pair is required' });
        }

        const symbol = `t${String(req.query.pair).toUpperCase()}`;
        const ticker = bitfinexStream.tickers[symbol];

        if (!ticker) {
            return res.status(400).json({ error: 'Pair is not supported' });
        }

        return res.status(200).json({ data: ticker });
    } catch (err: any) {
        logger.error(`Caught error: ${err.stack}.`, 'getTicker controller');
        return res.status(500).json({ error: err.message });
    }
};
