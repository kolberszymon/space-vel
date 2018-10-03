const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {ObjectID} = require('mongodb');

const app = express();
const urlencodedParser = bodyParser.urlencoded({extended: false});

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

//requring Tourist Schema
let Tourist = require(__dirname + '/public/js/tourist-schema.js');
let Flight = require(__dirname + '/public/js/flight-schema.js');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/Spacevel')
  .then(() =>  console.log('connection succesful'))
  .catch((err) => console.error(err));


app.get('/', (req, res) => {
  res.render('pages/home.ejs');
});

app.get('/tourist-managment', (req,res) => {
  res.render('pages/tourist-managment.ejs');
});

app.get('/all-flights', (req, res) => {
  Flight.find().then((flights) => {
    console.log(flights);
    res.status(200).render('pages/all-flights.ejs', {
      flights:flights
    });
  }).catch((err) => {
    console.log(err);
    res.status(400).render('pages/home.ejs');
  });

});

app.get('/add-tourist', (req, res) => {
  Flight.find().then((flights) => {
    res.status(200).render('pages/add-tourist.ejs', {
      flights:flights
    });
  });
});

app.get('/add-flight', (req, res) => {
  res.render('pages/add-flight.ejs');
});

app.get('/all-tourists', (req, res) => {

  let flights = Flight.find();

  Tourist.find().then((tourists) => {
    res.status(200).render('pages/all-tourists.ejs', {
      tourists: tourists,
      flights: flights
    });
  }).catch((err) => {
    console.log(err);
    res.status(400).render('pages/home.ejs');
  });
});

app.post('/add-tourist', urlencodedParser, (req, res) => {
  let fId = req.body.flightID;

  //Creating tourist object which we will post to db
  let tour = new Tourist ({
    name: req.body.name,
    surname: req.body.surname,
    sex: req.body.sex,
    country: req.body.country,
    notes: req.body.notes,
    birthdate: req.body.birthdate,
    _id: mongoose.Types.ObjectId(),
    flightID: fId
  });

  console.log(tour);

  if (fId === 'none') {
    tour.save().then((doc) => {
      console.log('Tourist added!')
      return res.status(200).render('pages/home.ejs')
    }).catch((err) => {
      console.log(err)
      return res.status(400).render('pages/home.ejs')
    });
  } else {

    // Check if there is avaiable seat.
    Flight.findOne({_id:fId}).then((flight) =>{
      //If there is avaiable seat add tourist to this flight and increase
      //FLIGHT IS AN ARRAY OF ALL FOUNDED OBJECT!! (there is only one object so index is 0)

      if (flight.listOfTourist.length < flight.numberOfSeats) {
          Flight.findOneAndUpdate({_id: fId}, {$push: {listOfTourist: tour._id}}).then((res) => {
            console.log('CAN BE');
          }).catch((err) => {
            console.log(err);
          });
          tour.save().then((doc) => {
            console.log(doc);
            console.log('Tourist added!')
            res.render('pages/home.ejs')
          }).catch((err) => {
            console.log(err)
            res.status(400).render('pages/home.ejs')
          });
      } else {

        //IF there is no avaiable seat we are adding tourist anyway but flight is set to none

        tour.flightID = 'none';
        tour.save().then((res) => {
          console.log('Tourist added!');
        });
        console.log('There is no avaiable seats');
        res.render('pages/home.ejs')
      };
    }).catch((err) => console.log(err));
  };
});

app.post('/add-flight', urlencodedParser, (req,res) => {

  let flight = new Flight ({
    departureTime: req.body.departureTime,
    arrivingTime: req.body.arrivingTime,
    numberOfSeats: req.body.numberOfSeats,
    numberOfTourist: req.body.numberOfTourist,
    price: req.body.price
  });

  flight.save().then((doc) => {
    console.log('Flight added');
    res.status(200).render('pages/home.ejs');
  });
});

app.get('/edit-tourist/:id', urlencodedParser,(req,res) => {
  let id = req.params.id;

  Tourist.findOne({_id: id}).then((tourist) => {
    Flight.find().then((flights) => {
      return res.render('pages/edit-tourist.ejs', {
        tourist: tourist,
        flights: flights
      });
    });
  });
});

app.get('/edit-flight/:id', urlencodedParser, (req, res) => {
  const id = req.params.id;

  Flight.findOne({_id: id}).then((flight) => {
    Tourist.find({_id: {$in: flight.listOfTourist}}).then(tourists => {
      res.render('pages/edit-flight.ejs', {
        flight: flight,
        tourists: tourists
      });
    }).catch(err => console.log(err));;
  }).catch(err => console.log(err));

});

app.post('/edit-tourist/:id', urlencodedParser, (req, res) => {
  let touristId = req.params.id;
  let flights = Flight.find();
  let tourists = Tourist.find();

  Tourist.findOne({_id: touristId}).then((tourist) => {
    let newFlightId = req.body.flightID;
    let oldFlightId = tourist.flightID;

    //If newFlight ==none just delete from oldFlightId and add

    if (newFlightId === 'none') {
      Tourist.findOneAndUpdate({_id: tourist._id}, {$set: {flightID: newFlightId}}).then(() => {
        Flight.findOneAndUpdate({_id: oldFlightId}, {$pull: {listOfTourist: tourist._id}}).then(() => {
          Tourist.find().then((tourists) => {
            res.redirect('/all-tourists');
            return res.render('pages/all-tourists.ejs', {
              tourists: tourists
            });
          });
        }).catch(err => console.log(err));;
      }).catch(err => console.log(err));;
    } else {
      Flight.findOne({_id: newFlightId}).then((flight) => {

        if (oldFlightId === 'none') {
          //If there is avaiable seat
          if (flight.listOfTourist.length < flight.numberOfSeats) {
            Flight.findOneAndUpdate({_id: newFlightId}, {$push: {listOfTourist: tourist._id}}).then(() => {
              Tourist.findOneAndUpdate({_id: tourist._id}, {$set: {flightID: newFlightId}}).then(() => {
                Tourist.find().then((tourists) => {
                  res.redirect('/all-tourists');
                  return res.render('pages/all-tourists.ejs', {
                    tourists: tourists
                  });
                }).catch(err => console.log(err));
              });
            });
          } else {
            console.log('There is no avaiable seats');
            res.redirect('/');
            return res.render('pages/home.ejs');
          }

        } else {
          if (flight.listOfTourist.length < flight.numberOfSeats) {
            Flight.findOneAndUpdate({_id: newFlightId}, {$push: {listOfTourist: tourist._id}}).then(() => {
              Flight.findOneAndUpdate({_id: oldFlightId}, {$pull: {listOfTourist: tourist._id}}).then(() => {
                Tourist.findOneAndUpdate({_id: tourist._id}, {$set: {flightID: newFlightId}}).then(() => {
                    Tourist.find().then((tourists) => {
                      res.redirect('/all-tourists');
                      res.render('pages/all-tourists.ejs', {
                        tourists: tourists
                      });
                    });
                });
              }).catch(err => console.log(err));;
            }).catch(err => console.log(err));;
          } else {
            console.log('There is no avaiable seats');
            res.redirect('/');
            return res.render('pages/home.ejs');
          }
        }
      });
    };
  }).catch(err => console.log(err));;
});

app.get('/delete-tourist/:id', urlencodedParser, (req, res) => {
  let id = req.params.id;

  //deleting tourist record and id in the flight
  //If tourist flight id was none we just simply delete the tourist if not we also remove him from flight listoftourist
  Tourist.findOneAndDelete({_id: id}).then((tourist) => {
    if (tourist.flightID !== 'none') {
      Flight.findOneAndUpdate({listOfTourist: tourist._id}, {$pull: {listOfTourist: tourist._id}}).then(() => {
        console.log('Deleted from flight');
      });
    }
  });


  Tourist.find().then((tourists) => {
    // Redirect so the url after deleting will be OKAY
    res.redirect('/all-tourists');
    return res.render('pages/all-tourists.ejs', {
      tourists: tourists
    });
  });

});

app.get('/cancel-flight/:id', urlencodedParser, (req, res) => {
  let touristId = req.params.id;

  Flight.findOneAndUpdate({listOfTourist: touristId}, {$pull: {listOfTourist: touristId}})
    .then(() => {
      Tourist.findOneAndUpdate({_id: touristId}, {$set: {flightID: 'none'}}).then();
    });
  Flight.find().then((flights) => {
    // Redirect so the url after deleting will be OKAY
    res.redirect('/all-flights');
    res.status(200).render('pages/all-flights.ejs', {
      flights:flights
    });
  });
});

app.get('/add-tourist-to-flight/:id',urlencodedParser, (req, res) => {

  let flightid = req.params.id;

  Flight.findOne({_id: flightid})
  .then((flight) => {
    Tourist.find({flightID: 'none'}).then((tourists) => {
      return res.render('pages/add-tourist-to-flight', {
        tourists: tourists,
        flight: flight
      });
    });
  });
});

app.get('/added/:id/:flightid', urlencodedParser, (req, res) => {
  let touristid = req.params.id;
  let flightid = req.params.flightid;

  Flight.findOne({_id: flightid}).then((flight) => {
    if (flight.listOfTourist.length < flight.numberOfSeats) {
      Tourist.findOneAndUpdate({_id: touristid}, {$set: {flightID: flightid}})
        .then(() => {
          Flight.findOneAndUpdate({_id: flightid}, {$push: {listOfTourist: touristid}}).then();
        });
      Flight.find().then((flights) => {
        res.redirect('/all-flights');
        res.status(200).render('pages/all-flights.ejs', {
          flights:flights
        });
      });
    } else {
      Flight.find().then((flights) => {
        res.redirect('/all-flights');
        console.log('There is no place for you maan');
        res.status(200).render('pages/all-flights.ejs', {
          flights:flights
        });
      });
    }
  })
});

app.get('/delete-flight/:id', urlencodedParser, (req, res) => {
  let id = req.params.id;

  Flight.findOneAndDelete({_id: id}).then((flight) => {
    console.log('HERE COMES THE DATA MODAFUCKA');
    console.log(flight.listOfTourist);
    for (let i = 0; i < flight.listOfTourist.length; i++) {
      Tourist.findOneAndUpdate({_id: flight.listOfTourist[i]}, {$set: {flightID: 'none'}}).then();
    }
  });

  Flight.find().then((flights) => {
    // Redirect so the url after deleting will be OKAY
    res.redirect('/all-flights');
    res.status(200).render('pages/all-flights.ejs', {
      flights:flights
    });
  });
})

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
