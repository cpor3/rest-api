/* eslint-disable no-unused-vars */
export enum BitfinexBooksPricePointsEnum {
    _1 = '1',
    _25 = '25',
    _100 = '100',
    _250 = '250',
};

export enum BitfinexChannelEnum {
    TICKER = 'ticker',
    TRADES = 'trades',
    BOOKS = 'book',
    CANDLES = 'candles',
    STATUS = 'status',
};

export enum BitfinexRequestEventEnum {
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
};

export enum BitfinexResponseEventEnum {
    INFO = 'info',
    SUBSCRIBED = 'subscribed',
    UNSUBSCRIBED = 'unsubscribed',
};

export enum BitfinexPriceAggregationLevelEnum {
    P0 = 'P0', // 5 significant figures
    P1 = 'P1', // 4 significant figures
    P2 = 'P2', // 3 significant figures
    P3 = 'P3', // 2 significant figures
    P4 = 'P4', // 1 significant figures
};
/* eslint-enable no-unused-vars */

export interface IBitfinexConfig {
    api: string
    pairs: Array<string>
    maxSubscriptions: number
    heartbeatPeriod: number
    pricePoints: BitfinexBooksPricePointsEnum
    pricePrecision: BitfinexPriceAggregationLevelEnum
};

export interface ITicker {
    bid: {
        price: number,
        amount: number
    },
    ask: {
        price: number,
        amount: number
    }
};

export interface IPriceLevel {
    price: number,
    count: number,
    amount: number
};

export interface IBookSide {
    [priceLevel: number]: IPriceLevel
};

export interface IBook {
    bids: IBookSide,
    asks: IBookSide
};

export type IBookSnapshot = Array<number>;
