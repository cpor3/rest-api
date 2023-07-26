import Ws from 'ws';
import { logger } from '../utils/logger';
import { sleep } from '../utils/utils';
import {
    IBitfinexConfig,
    BitfinexChannelEnum,
    BitfinexRequestEventEnum,
    BitfinexResponseEventEnum,
    IBook,
    IBookSnapshot,
    ITicker,
    BitfinexPriceAggregationLevelEnum,
    BitfinexBooksPricePointsEnum,
    IPriceLevel,
} from '../interfaces/bitfinexStream.interface';

export class BitfinexStream {
    private _url: string;
    private _name: string;
    private _pairs: Array<string>;
    private _maxSubscriptions: number; // https://docs.bitfinex.com/docs/ws-general#subscribe-to-channels
    private _heartbeatPeriod: number; // If no heartbeat is received within specified seconds, reconnect (https://docs.bitfinex.com/docs/ws-general#heartbeating)
    private _heartbeatIntervalId: NodeJS.Timer | undefined = undefined;
    private _connectionRetries: number;
    private static maxConnectionRetries: number = 3;
    private _pricePrecision: BitfinexPriceAggregationLevelEnum;
    private _pricePoints: BitfinexBooksPricePointsEnum;
    private _ws: Ws | undefined = undefined;
    private _books: {
        [symbol: string]: IBook;
    };

    private _booksSnapshots: {
        [symbol: string]: {
            bids: IBookSnapshot,
            asks: IBookSnapshot
        }
    };

    private _channels: {
        [chanId: string]: { channel: string, symbol: string }
    };

    private _tickers: {
        [symbol: string]: ITicker
    };

    public get name(): string { return this._name; };
    public get books() { return this._books; };
    public get booksSnapshots() { return this._booksSnapshots; };
    public get tickers() { return this._tickers; };

    constructor(config: IBitfinexConfig, name='Bitnifex Service') {
        this._url = config.api;
        this._name = name;
        this._pairs = config.pairs;
        this._heartbeatPeriod = config.heartbeatPeriod;
        this._maxSubscriptions = config.maxSubscriptions;
        this._connectionRetries = 0;
        this._pricePoints = config.pricePoints;
        this._pricePrecision = config.pricePrecision;
        this._channels = {};
        this._tickers = {};
        this._books = {};
        this._booksSnapshots = {};

        if (this._pairs.length > this._maxSubscriptions/2) {
            // TODO: create multiple ws connections
            const errorMsg = 'Maximum subscriptions exceeded (too many pairs).';
            logger.error(errorMsg, this.name);
            throw Error(errorMsg);
        }

        this.connect();
        process.on('exit', () => this.close());
    }

    connect() {
        if (this.isOnline()) {
            logger.warn('Trying to connect to Bitfinex stream but it\'s already open.', this.name);
            return;
        }

        try {
            this._ws = new Ws(this._url);
            this._ws.on('open', this.onOpen.bind(this));
            this._ws.on('message', this.onMessage.bind(this));
            this._ws.on('close', this.onClose.bind(this));
            this._ws.on('error', this.onError.bind(this));
            this._connectionRetries = 0;
        } catch (error) {
            this._connectionRetries++;

            if (this._connectionRetries >= BitfinexStream.maxConnectionRetries) {
                const errorMsg = `Could not connect to Bitfinex stream after ${BitfinexStream.maxConnectionRetries} attemps. ${error}.`;
                logger.error(errorMsg, this.name);
                throw Error(errorMsg);
            }

            logger.warn(`Could not connect to Bitfinex stream. ${error}. Retrying in 5 seconds...`, this.name);
            sleep(5000).then(this.connect.bind(this));
        }
    }

    close() {
        if (this._ws?.readyState !== Ws.OPEN) {
            logger.warn('Trying to close websocket connection but it\'s not currently open.', this.name);
            return;
        }
        clearInterval(this._heartbeatIntervalId);
        this._ws.close();
    }

    isOnline() {
        return this._ws?.readyState === Ws.OPEN;
    }

    resetHeartbeatInterval() {
        clearInterval(this._heartbeatIntervalId);
        this._heartbeatIntervalId = setInterval(this.onHeartbeatLost.bind(this), this._heartbeatPeriod);
    }

    onOpen() {
        logger.info('Bitfinex stream connected', this.name);
        this.subscribeAllPairs();
        this.resetHeartbeatInterval();
    }

    onClose() {
        logger.info('Bitfinex stream disconnected', this.name);
        this._ws = undefined;
    }

    onHeartbeatLost() {
        clearInterval(this._heartbeatIntervalId);
        logger.warn('Heartbeat lost. Reconnecting...', this.name);
        this.connect();
    }

    onError(error: Error) {
        logger.error(`Error caught: ${error}. Reconnecting...`, this.name);
        this.close();
        this.connect();
    }

    subscribeAllPairs() {
        if (!this.isOnline()) {
            logger.warn('Trying to subscribe to all pairs but websocket is not currently open.', this.name);
            return;
        }

        this._pairs.forEach(pair => {
            this._ws?.send(
                JSON.stringify({
                    event: BitfinexRequestEventEnum.SUBSCRIBE,
                    channel: BitfinexChannelEnum.TICKER,
                    symbol: pair
                })
            );
            this._ws?.send(
                JSON.stringify({
                    event: BitfinexRequestEventEnum.SUBSCRIBE,
                    channel: BitfinexChannelEnum.BOOKS,
                    symbol: pair,
                    prec: this._pricePrecision,
                    len: this._pricePoints,
                })
            );
        });
    }

    onMessage(msg: string) {
        let parsedMessage;

        try {
            parsedMessage = JSON.parse(msg);
        } catch (error) {
            logger.error(`Error parsing message: ${error}.`, this.name);
            return;
        }

        if (parsedMessage instanceof Array) {
            const [ channelId, data ] = parsedMessage;

            if (data === 'hb') {
                logger.debug('Hearbeat received', this.name);
                this.resetHeartbeatInterval();
                return;
            }

            if (data instanceof Array) {
                switch (this._channels[channelId].channel) {
                case BitfinexChannelEnum.TICKER:
                    this.onTickerUpdate(data, this._channels[channelId].symbol);
                    break;
                case BitfinexChannelEnum.BOOKS:
                    if (data[0] instanceof Array) {
                        this.onBooksSnapshot(data, this._channels[channelId].symbol);
                    } else {
                        this.onBooksUpdate(data, this._channels[channelId].symbol);
                    }
                    break;
                default:
                    logger.warn(`Unhandled event: ${JSON.stringify(parsedMessage)}.`, this.name);
                }
                return;
            }
            logger.warn(`Unhandled event: ${JSON.stringify(parsedMessage)}.`, this.name);
        } else if (parsedMessage instanceof Object) {
            const { event, channel, chanId, version, symbol } = parsedMessage;

            switch (event) {
            case BitfinexResponseEventEnum.INFO:
                logger.debug(`Current bitfinex websocket API version: ${version}.`, this.name);
                break;
            case BitfinexResponseEventEnum.SUBSCRIBED:
                logger.debug(`Subscribed to ${channel} channel (${symbol}).`, this.name);
                this._channels[chanId] = { channel, symbol };
                break;
            case BitfinexResponseEventEnum.UNSUBSCRIBED:
                logger.debug(`Unsubscribed from ${channel} channel (${symbol}).`, this.name);
                delete this._channels[chanId];
                break;
            default:
                logger.warn(`Unhandled event: ${JSON.stringify(parsedMessage)}.`, this.name);
            }
        }
    }

    onTickerUpdate(data: any, symbol: string) {
        const [ BID,
            BID_SIZE,
            ASK,
            ASK_SIZE,
            DAILY_CHANGE,
            DAILY_CHANGE_RELATIVE,
            LAST_PRICE,
            VOLUME,
            HIGH,
            LOW ] = data; // https://docs.bitfinex.com/reference/ws-public-ticker

        this._tickers[symbol] = {
            bid: {
                price: BID,
                amount: BID_SIZE
            },
            ask: {
                price: ASK,
                amount: ASK_SIZE
            }
        };
    }

    addBookRecord(price: number, count: number, amount: number, symbol: string) {
        const side = amount > 0 ? 'bids' : 'asks';
        amount = Math.abs(amount);
        this._books[symbol] = {
            ...this._books?.[symbol],
            [side]: {
                ...this._books[symbol]?.[side],
                [price]: {
                    price,
                    count,
                    amount
                }
            }
        };
    }

    deleteBookRecord(price: number, count: number, amount: number, symbol: string) {
        const side = amount > 0 ? 'bids' : 'asks';
        delete this._books[symbol][side][price];
    }

    sortBookPrices(symbol: string) {
        const bidPrices = Object.keys(this._books[symbol].bids).map(price => parseFloat(price));
        bidPrices.sort((a, b) => b - a);
        this._booksSnapshots[symbol] = {
            ...this._booksSnapshots?.[symbol],
            bids: bidPrices
        };

        const askPrices = Object.keys(this._books[symbol].asks).map(price => parseFloat(price));
        askPrices.sort((a, b) => a - b);
        this._booksSnapshots[symbol] = {
            ...this._booksSnapshots?.[symbol],
            asks: askPrices
        };
    }

    onBooksSnapshot(bookRecords: Array<IBookSnapshot>, symbol: string) {
        bookRecords.forEach((bookRecord: IBookSnapshot) => {
            const [ price, count, amount ] = bookRecord; // https://docs.bitfinex.com/reference/ws-public-books
            this.addBookRecord(price, count, amount, symbol);
        });
    }

    onBooksUpdate(bookRecord: any, symbol: string) {
        const [ price, count, amount ] = bookRecord; // https://docs.bitfinex.com/reference/ws-public-books

        if (count === 0) {
            this.deleteBookRecord(price, count, amount, symbol);
            return;
        }

        this.addBookRecord(price, count, amount, symbol);
        this.sortBookPrices(symbol);
    }
}
