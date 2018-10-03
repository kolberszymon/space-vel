const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let flightSchema = new Schema({
    departureTime: {
      type: String,

    },
    arrivingTime: {
      type: String,

    },
    numberOfSeats: {
      type: Number,
      required: true
    },
    listOfTourist: {
      type: [String]
    },
    price: {
      type: Number
    }
});

let Flight = mongoose.model('FlightSchema', flightSchema);

module.exports = Flight;
