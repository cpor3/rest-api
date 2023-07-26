# REST API
### A public Rest API that retrieves market information for trading pairs

<br/>

## Description
This simple project demonstrates a public API implementation for retrieving market information of trading pairs.

<br/>

## Implementation

For the websocket streaming I chose the Bitfinex API.

Configuration is all located in `./src/config.js`.

For unit testing I chose Jest. There is a snapshot of an order book of BTC-USD which is used for the tests.

For the linter I chose ESLint. I prefer 4 spaces for indenting.

For logging I chose Winstom. The formatting is configured to use with Datadog, for instance.

I used Swager, which provides an excelent interface for the API documentation and testing.

<br/>

## Pending tasks
The following are some usefull future implementations:
- The Bitfinex API limits to 30 subscriptions per websocket connection. It would be good to implement a ws pool connections in the `BitfinexStream` class for scalability.
- The order book implementation would need to keep track of the sequence of the websocket messages, and also perform a checksum validation.
- In the `getEffectivePrice()` implementation, it should be defined how to handle cases where the amount received is negative, or very large (surpassing the number of order book price levels).
- In the `getMaxOrderSize()` implementation, it should be defined how to handle cases where the limit price received is negative, or very large/small (surpassing the number of order book price levels).

<br/>

## Future improvements
### Micro-services architecture
For scalability improvements, a micro-services architecture could be implemented, by using RabbitMQ as a message broker and segregate the tasks into a Gateway and a API Service, each of one could have several instances.

<br/>

## Running the API
1. Install dependencies
```
npm i
```
2. Run the linter and fix issues
```
npm run lint:fix
```
3. Run the tests
```
npm run test
```
4. Start in development mode
```
npm run dev
```
5. Build
```
npm run build
```
6. Start in production mode
```
npm run start
```
