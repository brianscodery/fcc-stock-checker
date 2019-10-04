const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const StockDataSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true,
    unique: true
  },
  ipLikes: {
    type: [{
      type: String,
      unique: true
    }],
    default: []
  }
});

module.exports = mongoose.model('stockData', StockDataSchema);