require('dotenv').config();
const
  debugWs = require('debug')('ws'),
  debug = require('debug')('app'),
  debugIRC = require('debug')('irc'),
  express = require('express'),
  session = require('express-session'),
  net = require('net'),
  https = require('https'),
  tmi = require('tmi.js'),
  router = express.Router();

let
  localws, iv = 0, overlay, server = net.createServer(socket => {
    overlay = socket;
    overlay.on('end', () => stop('endsocket'));
    overlay.on('error', () => stop('errorsocket'));
    debug('Ready')
  }).listen(7998),
  stop = e => {
    server.close(() => server.unref());
    localws.close();
    debug('*stop stream: %O', e)
  };
server.on('error', () => stop('errorserver'));

function uuid () {
  var u = require('crypto').randomBytes(16);
  u[6] &= 0x0f | 0x40; u[8] &= 0xbf | 0x80;
  return u.reduce((a, x, i) => a + (~[4, 6, 8, 10].indexOf(i) ? '-' : '') + x.toString(16).padStart(2, 0), '')
}

router.ws('/video', (ws, req) => {
  localws = ws;
  ws.on('message', function (msg) { overlay && overlay.write(msg) });
  ws.on('close', function (e) { debugWs('Close: %O', e) });
  debugWs('Open');

  // Chat feed
  let state = req.session.state = uuid();
  req.session.save();
  new Promise(r => {
    https.get(`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost:7999/access&response_type=token&scope=chat_login&state=${state}`, res => {
      res.setEncoding('utf8');
      let token = '';
      res.on('data', chunk => token += chunk);
      res.on('end', () => r(token));
    })
  }).then(token => new Promise(r => {
    debug('token retrieved');
    ws.send(JSON.stringify({ token }));
    accessResolve = r
  })).then(token => {
    function sendMessage (target, context, message) {
      if (context['message-type'] === 'whisper') client.whisper(target, message);
      else client.say(target, message)
    }

    let opts = {
      identity: {
        username: 'anademn',
        password: 'oauth:' + token
      },
      channels: ['#anademn']
    }, client = new tmi.client(opts);
    client.on('message', function (target, context, message, self) {
      debugIRC('[%s (%s)] %s: %s', target, context['message-type'], context.username, message);
      ws.send(JSON.stringify({ context: context['message-type'], username: context.username, message}))
    });
    client.on('connected', function (addr, port) {
      debugIRC('* Connected to %s:%s', addr, port);
      ws.send(JSON.stringify({ connected: true }))
    });
    client.on('disconnected', function onDisconnectedHandler (reason) {
      debugIRC('* Disconnected: %s', reason);
      ws.send(JSON.stringify({ disconnected: reason }))
    });
    client.connect()
  })
});

let accessResolve = () => {}
router.post('/video', (req, res) => {
  if (req.body.state == req.session.state) {
    accessResolve(req.body.access_token);
    accessResolve = () => {};
    res.end()
  } else res.status(401).end()
});

module.exports = router
