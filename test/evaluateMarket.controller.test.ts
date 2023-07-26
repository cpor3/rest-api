import { IBookSide, IBookSnapshot } from '../src/interfaces/bitfinexStream.interface';
import { getEffectivePrice, getMaxOrderSize } from '../src/utils/marketDepth';
import bitfinexStream from './bitfinexStream.json';

describe('Market Depth', () => {
    let book: IBookSide;
    let bookSnapshot: IBookSnapshot;

    describe('getEffectivePrice', () => {
        beforeAll(() => {
            book = bitfinexStream.book['tBTCUSD']['bids'];
            bookSnapshot = bitfinexStream.snapshots['tBTCUSD']['bids'];
        });

        it('should throw an error if the order book is undefined', () => {
            expect(() => getEffectivePrice(10, <IBookSide><unknown>undefined, bookSnapshot)).toThrow();
        });

        it('should throw an error if the order book snapshot is undefined', () => {
            expect(() => getEffectivePrice(10, book, <IBookSnapshot><unknown>undefined)).toThrow();
        });

        describe('bids', () => {
            it('should use the first price level if the order amount is zero', () => {
                expect(getEffectivePrice(0, book, bookSnapshot)).toBe(20000);
            });

            // TODO: define how to respond to negative amounts
            it('should use the first price level if the order amount is negative', () => {
                expect(getEffectivePrice(-15, book, bookSnapshot)).toBe(20000);
            });

            it('should fill the order using the first price level', () => {
                expect(getEffectivePrice(1, book, bookSnapshot)).toBe(20000);
            });

            it('should fill the order with the first and second prices', () => {
                // (1,579.7490481 * 20,000 + 200 * 10,000) / 1,779.7490481 = 18876.24606
                expect(getEffectivePrice(1779.7490481, book, bookSnapshot)).toBeCloseTo(18876.24606, 4);
            });

            it('should fill the order with the first and second prices', () => {
                // (1,579.7490481 * 20,000 + 695.0751044 * 10,000) / 2,274.824153 = 16,944.48864
                expect(getEffectivePrice(2274.824153, book, bookSnapshot)).toBeCloseTo(16944.48864, 4);
            });

            it('should fill the order with the first, second and third prices', () => {
                // (1,579.7490481 * 20,000 + 695.0751044 * 10,000 + 15 * 9,000) / 2,289.824153 = 16,892.4465
                expect(getEffectivePrice(2289.824153, book, bookSnapshot)).toBeCloseTo(16892.4465, 3);
            });
        });

        describe('asks', () => {
            beforeAll(() => {
                book = bitfinexStream.book['tBTCUSD']['asks'];
                bookSnapshot = bitfinexStream.snapshots['tBTCUSD']['asks'];
            });

            it('should use the first price level if the order amount is zero', () => {
                expect(getEffectivePrice(0, book, bookSnapshot)).toBe(30000);
            });

            // TODO: define how to respond to negative amounts
            it('should use the first price level if the order amount is negative', () => {
                expect(getEffectivePrice(-15, book, bookSnapshot)).toBe(30000);
            });

            it('should fill the order using the first price level', () => {
                expect(getEffectivePrice(1000, book, bookSnapshot)).toBe(30000);
            });

            it('should fill the order with the first and second prices', () => {
                // (1,085.85477097 * 30,000 + 200 * 40,000) / 1,285.85477097 = 31,555.3856
                expect(getEffectivePrice(1285.85477097, book, bookSnapshot)).toBeCloseTo(31555.3856, 3);
            });

            it('should fill the order with the first and second prices', () => {
                // (1,085.85477097 * 30,000 + 402.25193007 * 40,000) / 1,488.10670104 = 32,703.11214
                expect(getEffectivePrice(1488.10670104, book, bookSnapshot)).toBeCloseTo(32703.11214, 4);
            });

            it('should fill the order with the first, second and third prices', () => {
                // (1,085.85477097 * 30,000 + 402.25193007 * 40,000 + 300 * 50,000) / 1,788.106701 = 35,605.10136
                expect(getEffectivePrice(1788.106701, book, bookSnapshot)).toBeCloseTo(35605.10136, 4);
            });
        });
    });

    describe('getMaxOrderSize', () => {
        beforeAll(() => {
            book = bitfinexStream.book['tBTCUSD']['bids'];
            bookSnapshot = bitfinexStream.snapshots['tBTCUSD']['bids'];
        });

        it('should throw an error if the order book is undefined', () => {
            expect(() => getMaxOrderSize(10000, <IBookSide><unknown>undefined, bookSnapshot)).toThrow();
        });

        it('should throw an error if the order book snapshot is undefined', () => {
            expect(() => getMaxOrderSize(10000, book, <IBookSnapshot><unknown>undefined)).toThrow();
        });

        describe('bids', () => {
            it('should return 0 if the limit price is zero', () => {
                expect(getMaxOrderSize(0, book, bookSnapshot)).toBe(0);
            });

            // TODO: define how to respond to negative limit prices
            it('should return 0 if the limit price is negative', () => {
                expect(getMaxOrderSize(-10000, book, bookSnapshot)).toBe(0);
            });

            it('should return the all the amount of the first order book level and part of the second levels', () => {
                // (1,579.7490481 * 20,000 + 200 * 10,000) / 1,779.7490481 = 18876.24606
                expect(getMaxOrderSize(18876.24606, book, bookSnapshot)).toBeCloseTo(1779.7490481, 4);
            });

            it('should return the sum of the amounts of the first and second order book levels', () => {
                // (1,579.7490481 * 20,000 + 695.0751044 * 10,000) / 2,274.824153 = 16,944.48864
                expect(getMaxOrderSize(16944.48864, book, bookSnapshot)).toBeCloseTo(2274.824153, 4);
            });

            it('should return the sum of the amounts of the first, second third order book levels', () => {
                // (1,579.7490481 * 20,000 + 695.0751044 * 10,000 + 15 * 9,000) / 2,289.824153 = 16,892.4465
                expect(getMaxOrderSize(16892.4465, book, bookSnapshot)).toBeCloseTo(2289.824153, 4);
            });
        });

        describe('asks', () => {
            beforeAll(() => {
                book = bitfinexStream.book['tBTCUSD']['asks'];
                bookSnapshot = bitfinexStream.snapshots['tBTCUSD']['asks'];
            });

            it('should return 0 if the limit price is zero', () => {
                expect(getMaxOrderSize(0, book, bookSnapshot)).toBe(0);
            });

            // TODO: define how to respond to negative limit prices
            it('should return 0 if the limit price is negative', () => {
                expect(getMaxOrderSize(-10000, book, bookSnapshot)).toBe(0);
            });

            it('should return the all the amount of the first order book level and part of the second levels', () => {
                // (1,085.85477097 * 30,000 + 200 * 40,000) / 1,285.85477097 = 31,555.3856
                expect(getMaxOrderSize(31555.3856, book, bookSnapshot)).toBeCloseTo(1285.85477, 4);
            });

            it('should return the sum of the amounts of the first and second order book levels', () => {
                // (1,085.85477097 * 30,000 + 402.25193007 * 40,000) / 1,488.10670104 = 32,703.11214
                expect(getMaxOrderSize(32703.11214, book, bookSnapshot)).toBeCloseTo(1488.10670, 4);
            });

            it('should return the sum of the amounts of the first, second third order book levels', () => {
                // (1,085.85477097 * 30,000 + 402.25193007 * 40,000 + 300 * 50,000) / 1,788.106701 = 35,605.10136
                expect(getMaxOrderSize(35605.10136, book, bookSnapshot)).toBeCloseTo(1788.10670, 4);
            });
        });
    });
});
