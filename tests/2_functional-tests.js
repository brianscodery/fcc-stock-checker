/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const mongoose = require("mongoose");
const StockData = require("../models/stockData.js");
const nasdaq = require("../data/nasdaq.js");

chai.use(chaiHttp);

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  dbName: "fccAdvancedNode"
};
const connection = mongoose.createConnection(process.env.DB, options);

const getRandomTicker = () => {
  const randomIndex = Math.floor(Math.random() * nasdaq.length);
  return nasdaq[randomIndex];
};

suite("Functional Tests", () => {
  suite("GET /api/stock-prices => stockData object", () => {
    test("1 stock", done => {
      const randomTicker = "aapl";
      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker })
          .end((err, res) => {
            assert.isObject(res.body, "response should be an object");
            assert.property(
              res.body,
              "stockData",
              'response data should contain "stockData"'
            );
            const { stock, price, likes } = res.body.stockData;
            assert.equal(res.status, 200, "status should be 200");
            assert.equal(
              stock,
              randomTicker.toUpperCase(),
              `returned stock should equal requested stock: ${randomTicker}`
            );
            assert.isNumber(+price, "price should be a number");
            assert.include(
              price.toString(),
              ".",
              "price should have a decimal point"
            );
            assert.equal(likes, 0, "likes should be 0");
            done();
          });
      });
    });

    test("1 stock with like", done => {
      const randomTicker = "bac";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker, like: true })
          .end((err, res) => {
            assert.isObject(res.body, "response should be an object");
            assert.property(
              res.body,
              "stockData",
              'response data should contain "stockData"'
            );
            const { stock, price, likes } = res.body.stockData;
            assert.equal(res.status, 200, "status should be 200");
            assert.equal(
              stock,
              randomTicker.toUpperCase(),
              `returned stock should equal new stock: ${randomTicker}`
            );
            assert.isNumber(+price, "price should be a number");
            assert.include(
              price.toString(),
              ".",
              "price should have a decimal point"
            );
            assert.equal(likes, 1, "likes should be 1");
            done();
          });
      });
    });

    test("1 stock with like again (ensure likes arent double counted)", done => {
      const randomTicker = "ge";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker, like: true })
          .end((err, res) => {
            assert.isObject(res.body, "response should be an object");
            assert.property(
              res.body,
              "stockData",
              'response data should contain "stockData"'
            );
            const { stock, price, likes } = res.body.stockData;
            assert.equal(res.status, 200, "status should be 200");
            assert.equal(
              stock,
              randomTicker.toUpperCase(),
              `returned stock should equal new stock: ${randomTicker.toUpperCase()}`
            );
            assert.isNumber(+price, "price should be a number");
            assert.include(
              price.toString(),
              ".",
              "price should have a decimal point"
            );
            assert.equal(likes, 1, "likes should be 1");
            chai
              .request(server)
              .get("/api/stock-prices")
              .query({ stock: randomTicker, like: true })
              .end((err, res) => {
                assert.isObject(res.body, "response should be an object");
                assert.property(
                  res.body,
                  "stockData",
                  'response data should contain "stockData"'
                );
                const { stock, price, likes } = res.body.stockData;
                assert.equal(res.status, 200, "status should be 200");
                assert.equal(
                  stock,
                  randomTicker.toUpperCase(),
                  `returned stock should equal new stock: ${randomTicker}`
                );
                assert.isNumber(+price, "price should be a number");
                assert.include(
                  price.toString(),
                  ".",
                  "price should have a decimal point"
                );
                assert.equal(likes, 1, "likes should be 1");
                done();
              });
          });
      });
    });

    test("1 stock with invalid ticker symbol", done => {
      const randomTicker = "darn";
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: randomTicker })
        .end((err, res) => {
          assert.equal(res.status, 400, "status should be 400");
          assert.equal(
            res.text,
            "Problem getting stock quotes. Check entered ticker symbols and try again.",
            'response should be "Problem getting stock quotes. Check entered ticker symbols and try again."'
          );
          done();
        });
    });

    test("2 stocks", done => {
      const randomTicker1 = "calm";
      const randomTicker2 = "camp";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker1, stock2: randomTicker2 })
          .end((err, res) => {
            assert.isObject(res.body, "response should be an object");
            assert.isArray(res.body.stockData, "stockData should be an array");
            assert.equal(
              res.body.stockData.length,
              2,
              "stockData array should be length 2"
            );
            const {
              stock: stock1,
              price: price1,
              rel_likes: likes1
            } = res.body.stockData[0];
            const {
              stock: stock2,
              price: price2,
              rel_likes: likes2
            } = res.body.stockData[1];

            assert.equal(res.status, 200, "status should be 200");
            assert.equal(
              stock1,
              randomTicker1.toUpperCase(),
              `returned stock 1 should equal requested stock 1: ${randomTicker1}`
            );
            assert.equal(
              stock2,
              randomTicker2.toUpperCase(),
              `returned stock 2 should equal requested stock 2: ${randomTicker1}`
            );
            assert.isNumber(+price1, "price 1 should be a number");
            assert.isNumber(+price2, "price 1 should be a number");
            assert.include(
              price1.toString(),
              ".",
              "price 1 should have a decimal point"
            );
            assert.include(
              price2.toString(),
              ".",
              "price 2 should have a decimal point"
            );
            assert.equal(likes1, 0, "likes 1 should be 0");
            assert.equal(likes2, 0, "likes 2 should be 0");
            done();
          });
      });
    });

    test("2 stocks with likes", done => {
      const randomTicker1 = "calm";
      const randomTicker2 = "camp";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker1, stock2: randomTicker2, like: true })
          .end((err, res) => {
            assert.isObject(res.body, "response should be an object");
            assert.isArray(res.body.stockData, "stockData should be an array");
            assert.equal(
              res.body.stockData.length,
              2,
              "stockData array should be length 2"
            );
            const {
              stock: stock1,
              price: price1,
              rel_likes: likes1
            } = res.body.stockData[0];
            const {
              stock: stock2,
              price: price2,
              rel_likes: likes2
            } = res.body.stockData[1];

            assert.equal(res.status, 200, "status should be 200");
            assert.equal(
              stock1,
              randomTicker1.toUpperCase(),
              `returned stock 1 should equal requested stock 1: ${randomTicker1}`
            );
            assert.equal(
              stock2,
              randomTicker2.toUpperCase(),
              `returned stock 2 should equal requested stock 2: ${randomTicker1}`
            );
            assert.isNumber(+price1, "price 1 should be a number");
            assert.isNumber(+price2, "price 1 should be a number");
            assert.include(
              price1.toString(),
              ".",
              "price 1 should have a decimal point"
            );
            assert.include(
              price2.toString(),
              ".",
              "price 2 should have a decimal point"
            );
            assert.equal(likes1, 0, "likes 1 should be 0");
            assert.equal(likes2, 0, "likes 2 should be 0");
            chai
              .request(server)
              .get("/api/stock-prices")
              .query({ stock: randomTicker1 })
              .end((err, res) => {
                const { likes } = res.body.stockData;
                assert.equal(likes, 1, "likes should be 1");
                chai
                  .request(server)
                  .get("/api/stock-prices")
                  .query({ stock: randomTicker2 })
                  .end((err, res) => {
                    const { likes } = res.body.stockData;
                    assert.equal(likes, 1, "likes should be 1");
                    done();
                  });
              });
          });
      });
    });

    test("2 stocks with first liked", done => {
      const randomTicker1 = "calm";
      const randomTicker2 = "camp";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker1, like: true })
          .end((err, res) => {
            chai
              .request(server)
              .get("/api/stock-prices")
              .query({ stock: randomTicker1, stock2: randomTicker2 })
              .end((err, res) => {
                assert.isObject(res.body, "response should be an object");
                assert.isArray(
                  res.body.stockData,
                  "stockData should be an array"
                );
                assert.equal(
                  res.body.stockData.length,
                  2,
                  "stockData array should be length 2"
                );
                const {
                  stock: stock1,
                  price: price1,
                  rel_likes: likes1
                } = res.body.stockData[0];
                const {
                  stock: stock2,
                  price: price2,
                  rel_likes: likes2
                } = res.body.stockData[1];

                assert.equal(res.status, 200, "status should be 200");
                assert.equal(
                  stock1,
                  randomTicker1.toUpperCase(),
                  `returned stock 1 should equal requested stock 1: ${randomTicker1}`
                );
                assert.equal(
                  stock2,
                  randomTicker2.toUpperCase(),
                  `returned stock 2 should equal requested stock 2: ${randomTicker1}`
                );
                assert.isNumber(+price1, "price 1 should be a number");
                assert.isNumber(+price2, "price 1 should be a number");
                assert.include(
                  price1.toString(),
                  ".",
                  "price 1 should have a decimal point"
                );
                assert.include(
                  price2.toString(),
                  ".",
                  "price 2 should have a decimal point"
                );
                assert.equal(likes1, 1, "likes 1 should be 1");
                assert.equal(likes2, -1, "likes 2 should be -1");
                done();
              });
          });
      });
    });

    test("2 stocks with second liked", done => {
      const randomTicker1 = "calm";
      const randomTicker2 = "camp";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker2, like: true })
          .end((err, res) => {
            chai
              .request(server)
              .get("/api/stock-prices")
              .query({ stock: randomTicker1, stock2: randomTicker2 })
              .end((err, res) => {
                assert.isObject(res.body, "response should be an object");
                assert.isArray(
                  res.body.stockData,
                  "stockData should be an array"
                );
                assert.equal(
                  res.body.stockData.length,
                  2,
                  "stockData array should be length 2"
                );
                const {
                  stock: stock1,
                  price: price1,
                  rel_likes: likes1
                } = res.body.stockData[0];
                const {
                  stock: stock2,
                  price: price2,
                  rel_likes: likes2
                } = res.body.stockData[1];

                assert.equal(res.status, 200, "status should be 200");
                assert.equal(
                  stock1,
                  randomTicker1.toUpperCase(),
                  `returned stock 1 should equal requested stock 1: ${randomTicker1}`
                );
                assert.equal(
                  stock2,
                  randomTicker2.toUpperCase(),
                  `returned stock 2 should equal requested stock 2: ${randomTicker1}`
                );
                assert.isNumber(+price1, "price 1 should be a number");
                assert.isNumber(+price2, "price 1 should be a number");
                assert.include(
                  price1.toString(),
                  ".",
                  "price 1 should have a decimal point"
                );
                assert.include(
                  price2.toString(),
                  ".",
                  "price 2 should have a decimal point"
                );
                assert.equal(likes1, -1, "likes 1 should be -1");
                assert.equal(likes2, 1, "likes 2 should be 1");
                done();
              });
          });
      });
    });

    test("2 stocks with first ticker invalid", done => {
      let randomTicker1 = "calmy";
      let randomTicker2 = "camp";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker1, stock2: randomTicker2 })
          .end((err, res) => {
            assert.equal(res.status, 400, "status should be 400");
            assert.equal(
              res.text,
              "Problem getting stock quotes. Check entered ticker symbols and try again.",
              'response should be "Problem getting stock quotes. Check entered ticker symbols and try again."'
            );
            done();
          });
      });
    });
    test("2 stocks with second ticker invalid", done => {
      let randomTicker1 = "calm";
      let randomTicker2 = "campy";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker1, stock2: randomTicker2 })
          .end((err, res) => {
            assert.equal(res.status, 400, "status should be 400");
            assert.equal(
              res.text,
              "Problem getting stock quotes. Check entered ticker symbols and try again.",
              'response should be "Problem getting stock quotes. Check entered ticker symbols and try again."'
            );
            done();
          });
      });
    });
    test("2 stocks with both tickers invalid", done => {
      let randomTicker1 = "calmy";
      let randomTicker2 = "campy";

      connection.dropCollection("stockdatas", (err, results) => {
        chai
          .request(server)
          .get("/api/stock-prices")
          .query({ stock: randomTicker1, stock2: randomTicker2 })
          .end((err, res) => {
            assert.equal(res.status, 400, "status should be 400");
            assert.equal(
              res.text,
              "Problem getting stock quotes. Check entered ticker symbols and try again.",
              'response should be "Problem getting stock quotes. Check entered ticker symbols and try again."'
            );
            done();
          });
      });
    });
  });
});
