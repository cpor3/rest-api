import {
    IBitfinexConfig,
    BitfinexBooksPricePointsEnum,
    BitfinexPriceAggregationLevelEnum
} from './interfaces/bitfinexStream.interface';
import dotenv from 'dotenv';
dotenv.config();

export const PORT = parseInt(process.env.PORT || '3000');

export const BITFINEX_CONFIG: IBitfinexConfig = {
    api: 'wss://api-pub.bitfinex.com/ws/2',
    pairs: [ 'tBTCUSD', 'tETHUSD' ],
    maxSubscriptions: 30, // https://docs.bitfinex.com/docs/ws-general#subscribe-to-channels
    heartbeatPeriod: 30000, // https://docs.bitfinex.com/docs/ws-general#heartbeating
    pricePoints: BitfinexBooksPricePointsEnum._25,
    pricePrecision: BitfinexPriceAggregationLevelEnum.P0,
};
