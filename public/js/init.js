// Utilities
//   $ enhances querySelectorAll
function $ (sel, node) { return Array.prototype.slice.call( (node || document).querySelectorAll(sel) ) }

//   $.addEvents enhances addEventListener
$.addEvents = function (obj, node) {
  for (var q in obj) for (var e in obj[q])
    for (var ns = q ? $(q, node) : [window, document], es = e.split(' '), i = 0; i < es.length; i++)
      typeof ns === 'undefined' || ns.forEach(n => n.addEventListener(es[i], obj[q][e].bind(n))) };

//   $.Machine produces state machines for the page
$.Machine = function (s) {
  let es = {}, state = Object.seal(s), v = Object.values, r = Promise.resolve.bind(Promise);
  return Object.assign(this, {
    getState () { return state },
    on (e, fn) { (es[e] = es[e] || {})[fn.name] = fn; return this },
    emit (e, ...args) { return e in es && v(es[e]).reduce((s, fn) => (fn.apply(s, args), s), state) },
    emitAsync (e, ...args) { return e in es && v(es[e]).reduce((p, fn) => p.then(s => r(fn.apply(s, args)).then(() => s)), r(state)) },
    stop (e, fname = '') { e in es && delete es[e][fname]; return this } }) };

// Events
$.addEvents({
  '': {
    load () {
      $('button')[0].click();
      let canvas = $('canvas')[0];

      // HD1080 stream overlay
      canvas.width = 1920;
      canvas.height = 1080;
      overlay.emit('init-stream', canvas);
    },
    message (e) {
      console.log(e.data)
    }
  },
  button: {
    click () {
      $('head > script').forEach(x => x.remove());
      let js = document.createElement('script');
      js.src = '/js/overlay.js?' + Date.now();
      requestAnimationFrame(() => $('head')[0].appendChild(js))
    }
  }
});

// State machine
let overlay = new $.Machine(Object.seal({
  ctx: null,
  stream: null,
  socket: null,
  recorder: null,
  _: {}
}))

.on('init-stream', function (el) {
  this.ctx = el.getContext('2d');
  this.stream = el.captureStream(15);
  Object.assign(this, new Stream('ws://localhost:7999/video', this.stream))
}),

// Stream Object
Stream = function (uri, stream) {
  let ws = new WebSocket(uri), mr = new MediaRecorder(stream, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 3 * 1024 * 1024
  });
  Object.assign(mr, {
    ondataavailable (e) {
      if (e.target.state == 'recording') {
        console.log('*');
        ws.send(e.data)
      }
    },
    onstop () { ws.close.bind(ws) }
  });
  Object.assign(ws, {
    onopen (e) {
      console.log('WS connected');
      console.log('Beginning overlay streaming');
      mr.start(1000)
    },
    onmessage (e) {
      let data;
      try { data = JSON.parse(e.data) } catch (e) { return }
      let kl = Object.keys(data).length;
      if ('token' in data && kl == 1) {
        console.log('Oauth token received');
        let tmp = document.createElement('template');
        tmp.innerHTML = data.token;
        window.open(tmp.content.firstChild.href, 'oauth', 'left=200,top=200,width=420,height=420')
      } else if (['message', 'username', 'context'].every(x => x in data) && kl == 3) overlay.emit('chat', data);
      else if ('connected' in data && kl == 1) overlay.emit('chat', data);
      else if ('disconnected' in data && kl == 1) overlay.emit('chat', data);
    },
    onclose (e) {
      console.log('WS closed');
      mr.stop();
    }
  });
  return { socket: ws, recorder: mr }
}
