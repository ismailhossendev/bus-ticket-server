//setup basic server
const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.odx3u2z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const trips = client.db("busTicket").collection("trips");
const bookedSeat = client.db("busTicket").collection("bookedSeat");

// connect to the database
client.connect(err => {
    if (err) {
        console.log('Error connecting to database', err);
    } else {
        console.log('Connected to database');
    }
});

app.get('/trips', async (req, res) => {

    const query = {
        origin: (req.query.origin).toUpperCase(),
        destination: (req.query.destination).toUpperCase(),
    }
    if (req.query.busType) {
        query.busType = req.query.busType;
    }
    if (req.query.busClass) {
        query.busClass = req.query.busClass;
    }

    const allTrips = await trips.find(query).toArray();
    res.send(allTrips);
});

// view seats 
app.get('/view-seats', async (req, res) => {
    const date = req.query.date;
    const tripId = req.query.tripId
    const trip = await trips.findOne({ _id: ObjectId(tripId) });

    //check already booked
    const alreadyBooked = await bookedSeat.find({ bookingDate: date, tripId: tripId }).toArray();
    let bookedNumbers = []
    alreadyBooked.forEach(trip => {
        bookedNumbers = [...bookedNumbers, trip.seat].flat()

    });

    trip.bookedSeat = bookedNumbers
    res.send(trip)
})



//booking a  seat
app.post('/bookSeat', async (req, res) => {
    const seat = req.body;
    const result = await bookedSeat.insertOne(seat);
    if (result.insertedId) {
        res.send({
            success: true,
            message: 'Seat booked successfully'
        });
    } else {
        res.send({
            success: false,
            message: 'Seat booking failed'
        });
    }
});





app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});