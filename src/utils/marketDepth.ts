import { IBookSide, IBookSnapshot } from '../interfaces/bitfinexStream.interface';

/**
 * Given a book and a book snapshot, returns the effective price for a given amount
 *
 * @param {number} amount - The amount to trade
 * @param {IBookSide} book - The order book dictionary for a given side {priceLevel: {price, count, amount}}
 * @param {IBookSnapshot} bookSnapshot - An array of book prices, sorted in ascending(asks) or descending(bids) order
 * @returns {number} The effective price of the trade
 *
 * @throws {Error} If the book or book snapshot is missing or invalid.
 */
export function getEffectivePrice (amount: number, book: IBookSide, bookSnapshot: IBookSnapshot): number {
    if (!book || !bookSnapshot) throw Error('Missing or invalid book and/or book snapshot');

    let levelIndex = 0;
    let levelPrice = bookSnapshot[levelIndex];
    let acumAmount = book[levelPrice].amount;
    let acumPrice = levelPrice * acumAmount;

    // TODO: define how to respond to negative amounts
    // .. return first level price or throw error
    if (amount <= 0) return levelPrice;

    // TODO: decide how to handle large trade amounts
    // .. return last level price or throw error
    // .. the error could be caught for decreasing the book precision and re-running
    while (amount > acumAmount) {
        levelPrice = bookSnapshot[++levelIndex];
        acumPrice += levelPrice * book[levelPrice].amount;
        acumAmount += book[levelPrice].amount;
    }
    acumPrice -= (acumAmount - amount) * levelPrice;

    return acumPrice / amount;
}

/**
 * Given a book and a book snapshot, returns the order size for a given limit price
 *
 * @param {number} limitPrice - The desired limit price
 * @param {IBookSide} book - The order book dictionary for a given side {priceLevel: {price, count, amount}}
 * @param {IBookSnapshot} bookSnapshot - An array of book prices, sorted in ascending(asks) or descending(bids) order
 * @returns {number} The order size
 *
 * @throws {Error} If the book or book snapshot is missing or invalid.
 */
export function getMaxOrderSize(limitPrice: number, book: IBookSide, bookSnapshot: IBookSnapshot): number {
    if (!book || !bookSnapshot) throw Error('Missing or invalid book and/or book snapshot');

    let levelIndex = 0;
    let levelPrice = bookSnapshot[levelIndex];
    let levelAmount = book[levelPrice].amount;

    let acumAmount = levelAmount;
    let acumPrice = levelPrice * acumAmount;
    let effectivePrice = acumPrice / acumAmount;
    let lastEffectivePrice = effectivePrice;
    const side = bookSnapshot[1] > bookSnapshot[0] ? 'asks' : 'bids'; // TODO: evaluate using negative limitPrice for asks

    // TODO: define how to respond to negative limit prices
    // .. return 0 or throw error
    if (limitPrice <= 0) return 0;

    // TODO: decide how to handle small limit prices
    // .. return total size of orderbook or throw error
    // .. the error could be caught for decreasing the book precision and re-running
    while (side === 'asks' ? limitPrice > effectivePrice : limitPrice < effectivePrice) {
        levelPrice = bookSnapshot[++levelIndex];
        levelAmount = book[levelPrice].amount;
        acumPrice += levelPrice * levelAmount;
        acumAmount += levelAmount;
        lastEffectivePrice = effectivePrice;
        effectivePrice = acumPrice / acumAmount;
    }

    return (
        (acumAmount - levelAmount) * (1 + ((lastEffectivePrice - limitPrice) / (limitPrice - levelPrice)))
    );
}
