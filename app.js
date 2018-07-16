#!/usr/bin/node
'use strict';

require('dotenv').config();
const
  debug = require('debug')('app'),
  debugSrv = require('debug')('server'),
  express = require('express'),
  RateLimit = require('express-rate-limit'),
  helmet = require('helmet'),
  compression = require('compression'),
  /*{ MongoClient } = require('mongodb'),*/
  session = require('express-session'),
  /*MongoStore = require('connect-mongo')(session),*/
  bodyParser = require('body-parser'),
  hbs = require('express-hbs'),
  app = express(),
  expressWs = require('express-ws')(app);

var port = 7999, host = '0.0.0.0';


  // Middleware

app.enable('trust proxy');

var limiter = new RateLimit({
  windowMs: 15*60*1000,
  delayAfter: 100,
  delayMs: 3*1000,
  max: 200,
  message: "Flood limit"
});

app.use(helmet());
app.use(compression());
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SECRET,
  name: 'sessionId',
  /*store: new MongoStore({ db }),*/
  store: new session.MemoryStore(),
  /*cookie: {
    secure: true
  },*/
  rolling: true,
  unset: 'destroy',
  proxy: true
}));

app.use(bodyParser.json());
app.use(express.static('public'));

app.engine('hbs', hbs.express4({
  layoutsDir: __dirname + '/views/layouts',
  defaultLayout: __dirname + '/views/layouts/main'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(limiter);

// Controllers

app.use(require('./controllers/mainController.js'));
app.use(require('./controllers/wsController.js'));

app.use((req, res) => res.redirect('/'))

let server = app.listen(port, host, err => {
  if (err) debug('*err %O', err);
  else debugSrv('Listening on port %d', server.address().port)
})
