require('dotenv').config();
const
  debug = require('debug')('app'),
  express = require('express'),
  session = require('express-session'),
  router = express.Router();

router.get('/', (req, res) => res.render('home'));
router.get('/access', (req, res) => res.render('access'));

module.exports = router
