const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()


var serviceAccount = require("./configs/volunteer-network-moon-firebase-adminsdk-ds842-9d23658e6a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v8gxk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express()
app.use(bodyParser.json());
app.use(cors());
const port = 5000;



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const events = client.db("volunteer").collection("events");
  const registrations = client.db("volunteer").collection("registration");
  console.log("database connected")

  app.post('/addEvents', (req, res) => {
    const event = req.body;
    events.insertOne(event)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/volunteers', (req, res) => {
    registrations.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.post('/addRegistration', (req, res) => {
    const registration = req.body;
    registrations.insertOne(registration)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/events', (req, res) => {
    events.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/Registration', (req, res) => {

    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            registrations.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
        }).catch(function (error) {
          res.status(401).send('Un authorized access')
        });
    }
    else {
      res.status(401).send('Un authorized access')
    }
  })
  app.delete('/delete/:id', (req, res) => {
    registrations.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result.deletedCount > 0);
      })
  })

});


app.get('/', (req, res) => {
  res.send('Hello Volunteer Network')
})

app.listen(process.env.PORT || port)