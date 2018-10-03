const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let touristSchema = new Schema({
  name: {
    type: String,
    minlength: 3,
    required: true
  },
  surname: {
    type: String,
    minlength: 3,
    required: true
  },
  sex: {
    type: String,
  },
  country: {
    type: String
  },
  notes: {
    type: String,
    default: '-'
  },
  birthdate: {
    type:String,
    required:true
  },
  flightID: {
    type: String
  }
});

let Tourist = mongoose.model('TouristSchema', touristSchema);

module.exports = Tourist;
