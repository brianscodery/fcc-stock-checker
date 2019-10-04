/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const mongoose = require("mongoose");
const request = require("request");
const yahooFinance = require("yahoo-finance");
const StockData = require("../models/stockData.js");
const nasdaq = require("../data/nasdaq.js");

module.exports = app => {
  const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    dbName: "fccAdvancedNode"
  };
  const connection = mongoose.connect(process.env.DB, options, err => {
    if (err) {
      console.error(err);
    } else {
      console.log("DB connected swell-like");
    }
  });

  const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  app.route("/api/stock-prices").get(
    asyncMiddleware(async (req, res, next) => {
      console.log(req.query);
      let { stock: stock1, stock2, like } = req.query;
      
      const requestSymbols = [stock1, stock2].filter(stock => stock);
      const priceData = await yahooFinance
        .snapshot({
          fields: ["a"],
          symbols: requestSymbols
        })
        .catch(err => sendStockError(res, err));

      console.log(priceData);
      const stock1Data = await getStockData(stock1, like, req.ip);
      if (!stock2) {
        res.status(200).json(get1StockJsonResponse(stock1Data, priceData));
        return;
      } else {
      const stock2Data = await getStockData(stock2, like, req.ip);
        res.status(200).json(get2StocksJsonResponse(stock1Data, stock2Data, priceData))
      }
    })
  );

  
  
  
  
  const saveNewStock = async (stock, like, ip) => {
    return await new StockData({
      stock,
      ...(like && { ipLikes: ip })
    }).save();
  };
  
  
  const formatPrice = num => {
    return num.toFixed(2);
  };
  
  
  const sendStockError = (res, err) => {
    res
      .status(400)
      .send(
        "Problem getting stock quotes. Check entered ticker symbols and try again."
      );
    throw err;
  };
  
  
  const getStockData = async (stock, like, ip) => {
    const stockData = await StockData.findOne({ stock });
      if (!stockData) {
        return saveNewStock(stock, like, ip);
      } else {
        if (!stockData.ipLikes.includes(ip) && like) {
          return stockData.update({ $push: { ipLikes: ip } });
        } else {
          return stockData;
        }
      }
  };
  
  const get1StockJsonResponse = (stockData, priceData) => {
      return { stockData: {
            stock: stockData.stock.toUpperCase(),
            likes: stockData.ipLikes.length,
            price: formatPrice(priceData[stockData.stock].ask)
          }
        };
  }
  
  const get2StocksJsonResponse = (stock1Data, stock2Data, priceData) => {
    return {
        stockData: [
          {
            stock: stock1Data.stock.toUpperCase(),
            price: formatPrice(priceData[stock1Data.stock].ask),
            rel_likes: stock1Data.ipLikes.length - stock2Data.ipLikes.length,
          },
          {
            stock: stock2Data.stock.toUpperCase(),
            price: formatPrice(priceData[stock2Data.stock].ask),
            rel_likes: stock2Data.ipLikes.length - stock1Data.ipLikes.length,
          }
       ]
       };
  }
};
