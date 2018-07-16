// Overlay design
overlay.on('set-chroma', function (colour) {
  let ctx = this.ctx;
  ctx.fillStyle = colour || '#00b140';
  ctx.fillRect(0, 0, 1920, 1080)
})

.on('column', function (text) {
  // Notice
  let ctx = this.ctx, { width, fonts } = this._, height, top, textColor = '#fff',
      fontSize = 12, lineHeight = 17, padding = 10, screenwidth = this.ctx.canvas.width, screenheight = this.ctx.canvas.height;
  ctx.font = fontSize + `px ${fonts.body}`;
  let paragraphs = text.split('\n'), words = paragraphs.map(p => p.split(' ')), lines = [];
  paragraphs.forEach((p, ix) => {
    if ((ix == 0 || ix == paragraphs.length - 1) && !p.length) return;
    let curLine = '', i = 0;
    for (let j = 0; j <= words[ix].length; j++) {
      curLine = words[ix].slice(i, j).join(' ');
      if (ctx.measureText(curLine).width > width - 2 * padding) {
        lines.push(words[ix].slice(i, j - 1).join(' '));
        curLine = words[ix][i = j - 1]
      }
    }
    lines.push(curLine)
  });
  height = padding * 2 + fontSize + lineHeight * (lines.length - 1) + 8;
  ctx.fillStyle = '#001f3f';
  ctx.fillRect(screenwidth - width, top = screenheight - height, width, height);
  ctx.fillStyle = textColor || '#fff';
  top += padding + fontSize - lineHeight;
  lines.forEach(line => ctx.fillText(line, screenwidth - width + padding, (top += lineHeight)));

  // Chatbox
  let logoText = '💮anademn', logoSize = 36;
  ctx.fillStyle = '#ffdc00';
  ctx.fillRect(screenwidth - width, 0, width, screenheight - height);
  ctx.font = logoSize + `px ${fonts.logo}`;
  ctx.fillStyle = '#000';
  ctx.fillText(logoText, screenwidth - (width + ctx.measureText(logoText).width) / 2, logoSize * 3 / 2);
  this._.chatHeight = screenheight - height - 2 * logoSize
})

.on('load-fonts', function () {
/*
  var font = new FontFace('BB Roller Mono', 'url(/fonts/BBRollerMono.ttf)', { 'font-style': 'normal', 'font-weight': '400' });
  document.fonts.add(font);
  font.loaded.then(console.log);
  */
/*
  let css = document.createElement('link');
  css.rel = 'stylesheet'
  css.href = '/css/fonts.css';
  $('head')[0].appendChild(css)
  */
})

.on('chat', function (data) {
  console.log(data);
  switch (data.eventType) {
    case 'message':
    this._.chatmsgs.push(`${data.username}: ${data.message}`);
    setOverlay.bind(this)();
    break;

    case 'connected':
    this._.chatmsgs = [];
    setOverlay.bind(this)();
    break;
    case 'disconnected':
    console.log(`Disconnnected:${data.disconnected}`)
    break;

    case 'names':
    this._.users = data.users;
    break;

    case 'join':
    this._.chatmsgs.push(`${data.username} joined chat. Welcome to the fn show!`);
    setOverlay.bind(this)();
    break;
    case 'part':
    this._.chatmsgs.push(`${data.username} left chat.`);
    setOverlay.bind(this)();
    break;

    case 'subscription':
    this._.chatmsgs.push(`${data.username} just subscribed!! Thank you, 感謝, and welcome!`);
    setOverlay.bind(this)();
    case 'resub':
    this._.chatmsgs.push(`${data.username} resubscribed for ${data.months} months!! Welcome back 🤩`);
    setOverlay.bind(this)();
  }
})

.on('init-chat', function () { setOverlay.bind(this)() })

.on('reconnws', function () {
  this.socket.readyState == 3 || this.socket.close();
  let mr = this.recorder, ws = this.socket = new WebSocket('ws://localhost:7999/video');
  Object.assign(ws, {
    onopen (e) {
      console.log('WS connected');
      console.log('Restarted overlay streaming');
      mr.resume()
    },
    onmessage (e) {
      let data;
      try { data = JSON.parse(e.data) } catch (e) { return }
      let kl = Object.keys(data).length;
      if ('token' in data && kl == 1) {
        console.log('Oauth token received');
        let tmp = document.createElement('template');
        tmp.innerHTML = data.token;
        window.open(tmp.content.firstChild.href, 'oauth', 'left=200,top=200,width=420,height=540')
      } else if ('eventType' in data) overlay.emit('chat', data)
    },
    onclose (e) {
      console.log('WS closed');
      mr.pause()
    }
  })
})

.on('header', function (colour, text) {
  let ctx = this.ctx, { fonts } = this._, availwidth = this.ctx.canvas.width - this._.width, fontSize = 24, padding = 12;
  ctx.font = fontSize + `px ${fonts.title}`;
  let { width } = ctx.measureText(text);
  ctx.fillStyle = colour || '#fff';
  ctx.fillRect((availwidth - width)/2 - padding, 12, width + 2 * padding, fontSize + 2 * padding);
  ctx.fillStyle = '#000';
  ctx.fillText(text, (availwidth - width)/2, fontSize + padding + 12)
})

.on('blind', function (toggle) {
  let ctx = this.ctx, { fonts } = this._;
  if (toggle == 'on') {
    var img = new Image();
    img.onload = () => {
      let screenwidth = this.ctx.canvas.width, screenheight = this.ctx.canvas.height;
      ctx.drawImage(img, 0, 0);
      setOverlay.bind(this)();

      ctx.font = `48px ${fonts.title}`;
      let text = 'ANADEMN CHANNEL | BRB', { width } = ctx.measureText(text);
      ctx.fillStyle = '#fffb';
      ctx.fillRect(screenwidth/2 - 30 - width/2, screenheight/2 - 48, width + 60, 36 + 60);
      ctx.fillStyle = '#000';
      ctx.fillText(text, (screenwidth - width)/2, screenheight/2 + 18)
      document.title = 'Stream overlay | BLIND';

      // green -> purple
      var id = ctx.getImageData(0, 0, screenwidth, screenheight), view = new Uint32Array(id.data.buffer);
      for (var i = 0; i < id.data.length; i += 4) {
        if (id.data[i] < 0x40 && id.data[i+1] > 0x7f && id.data[i+2] < 0x80) view[i >> 2] = 0xffa54164 }
      ctx.putImageData(id, 0, 0);
    };
    img.src = '/img/smpte.jpg'
  } else if (toggle == 'off') {
    overlay.emit('set-chroma');
    document.title = 'Stream overlay | VISIBLE';
    Object.assign(this._, {
      width: 300,
      chatmsgs: this._.chatmsgs || [],
      fonts: { body: 'BB Roller Mono', title: 'Was A Screenfont', logo: 'Was A Screenfont'}
    });
    setOverlay.bind(this)()
  }
})

.on('animate-test', function (stop) {
  let ctx = this.ctx, count = 0;
  if (stop) {
    clearInterval(iv);
    ctx.fillStyle = '#00b140';
    ctx.fillRect(0, 0, 100, 100);
    return
  }
  iv = setInterval(() => {
    count++;
    ctx.save();
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.fillStyle = '#00b140';
    ctx.fillRect(0, 0, 100, 100);
    ctx.beginPath();
    let theta = 2 * count * Math.PI / 15;
    ctx.arc(50, 50, 40, Math.floor(3 * theta / 4 / Math.PI) * 4 * Math.PI / 3 + count / 10, theta + count / 10);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore()
  }, 1000/15)
})

.on('face?', function () {
  let video = document.createElement('video');
  navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 }
  }).then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      setInterval(() => this.ctx.drawImage(video, 0, 0, vidw, vidh), 1000)
    }
  }).catch(console.log)
});

function initChat () {
  let ctx = this.ctx, { chatHeight, width, fonts } = this._, lines = [], fontSize = 12, lineHeight = 19, padding = 9,
      screenwidth = this.ctx.canvas.width;
  ctx.fillStyle = '#ffdc00';
  ctx.fillRect(screenwidth - width, 96, width, chatHeight - 96);
  ctx.font = `12px ${fonts.body}`;
  let chatmsgs = this._.chatmsgs.slice(), length = chatmsgs.length, words;
  for (let j, k = 0; k < length; k++) {
    let line = chatmsgs.pop(), curLine = '', i = 0;
    words = line.split(' ');
    for (j = 0; j <= words.length; j++) {
      curLine = words.slice(i, j).join(' ');
      if (ctx.measureText(curLine).width > width - 2 * padding) {
        lines.push((i ? '  ' : '') + words.slice(i, j - 1).join(' '));
        curLine = words[i = j - 1]
      }
      if (chatHeight < lineHeight * (lines.length) + fontSize + padding) break // wat
    }
    if (!chatmsgs.length || j == words.length + 1) lines.push((i ? '  ' : '') + curLine);
  }
  ctx.fillStyle = '#000';
  let top = 96 + fontSize - lineHeight;
  lines.forEach(line => ctx.fillText(line, screenwidth - width + padding, (top += lineHeight)))
}

overlay.emit('blind', 'off');
function setOverlay () {
  overlay.emit('header', '#7fdbff', '😱 "It\'s 2048 but chat can f*** with my game" 😱');
  overlay.emit('column', `
• Stream #15, Sun 22 Jul 2018
Discord: https://discord.gg/sbZW3Yk
Twitter: @anademnTV
Instagram: @anademn

I am so full from okonomikayi tonight 😵

We are *FINISHING* social media image editing tonight, and moving on to makin' a game. End of story!
`);
  initChat.bind(this)()
}
