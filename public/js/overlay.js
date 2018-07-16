// Overlay design
overlay.on('set-chroma', function (colour) {
  let ctx = this.ctx;
  ctx.fillStyle = colour || '#00b140';
  ctx.fillRect(0, 0, 1920, 1080)
})

.on('column', function (text) {
  // Notice
  let ctx = this.ctx, { width } = this._, height, top, textColor = '#fff',
      fontSize = 24, lineHeight = 34, padding = 12;
  ctx.font = fontSize + 'px sans';
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
  ctx.fillRect(1920 - width, top = 1080 - height, width, height);
  ctx.fillStyle = textColor || '#fff';
  top += padding + fontSize - lineHeight;
  lines.forEach(line => ctx.fillText(line, 1920 - width + padding, (top += lineHeight)));

  // Chatbox
  let logoText = '💮anademn', logoSize = 48;
  ctx.fillStyle = '#ffdc00';
  ctx.fillRect(1920 - width, 0, width, 1080 - height);
  ctx.font = logoSize + 'px bold sans';
  ctx.fillStyle = '#000';
  ctx.fillText(logoText, 1730 - ctx.measureText(logoText).width / 2, logoSize * 3 / 2);
  this._.chatHeight = 1080 - height - 2 * logoSize
})

.on('chat', function (data) {
  console.log(data);
  if ('connected' in data) this._.chatmsgs = [];
  else if ('disconnected' in data) console.log(`Disconnnected:${data.disconnected}`);
  else if ('message' in data) {
    this._.chatmsgs.push(`{${data.context}} ${data.username}: ${data.message}`);
    initChat.bind(this)
  }
})

.on('header', function (colour, text) {
  let ctx = this.ctx;
  ctx.font = '48px serif';
  let { width } = ctx.measureText(text);
  ctx.fillStyle = colour || '#fff';
  ctx.fillRect(930 - width/2, 12, width + 60, 36 + 60);
  ctx.fillStyle = '#000';
  ctx.fillText(text, 960 - width/2, 48 + 30)
})

.on('blind', function (toggle) {
  let ctx = this.ctx;
  if (toggle == 'on') {
    var img = new Image();
    img.onload = () => {
      let screenwidth = 1920, screenheight = 1080;
      ctx.drawImage(img, 0, 0);

      ctx.font = '48px bold sans';
      let text = 'ANADEMN CHANNEL | BRB', { width } = ctx.measureText(text);
      ctx.fillStyle = '#fff';
      ctx.fillRect(930 - width/2, 492, width + 60, 36 + 60);
      ctx.fillStyle = '#000';
      ctx.fillText(text, 960 - width/2, 558)
      document.title = 'Stream overlay | BLIND'
      setOverlay()

      // green -> purple
      var id = ctx.getImageData(0, 0, screenwidth, screenheight), view = new Uint32Array(id.data.buffer);
      for (var i = 0; i < id.data.length; i += 4) {
        if (id.data[i] < 0x40 && id.data[i+1] > 0xbf && id.data[i+2] < 0x40) view[i >> 2] = 0xffa54164 }
      ctx.putImageData(id, 0, 0);
    };
    img.src = '/img/smpte.jpg';
    console.log(img)
  } else if (toggle == 'off') {
    overlay.emit('set-chroma');
    document.title = 'Stream overlay | VISIBLE';
    this._.width = 380;
    setOverlay();
    initChat.bind(this)()
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
  let ctx = this.ctx, { chatHeight, width } = this._, lines = [], fontSize = 18, lineHeight = 28, padding = 9;
  ctx.fillStyle = '#ffdc00';
  ctx.fillRect(1920 - width, 96, width, chatHeight - 96);
  ctx.font = '18px sans';
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
      if (chatHeight < lineHeight * (lines.length + 1) - fontSize + padding) break
    }
    if (!chatmsgs.length || j == words.length + 1) lines.push((i ? '  ' : '') + curLine);
  }
  ctx.fillStyle = '#000';
  let top = 96 + fontSize - lineHeight;
  lines.forEach(line => ctx.fillText(line, 1920 - width + padding, (top += lineHeight)))
}

overlay.emit('blind', 'off');
function setOverlay () {
  overlay.emit('header', '#7fdbff', '🎙 Say hi if you can hear my voice! 🎙');
  overlay.emit('column', `
• Stream #10, Mon 16 Jul 2018
It Begins: social media remix 👨‍💻👌
Discord: https://discord.gg/sbZW3Yk
Twitter: @anademnTV

I've been off twitch for a couple of days, integrating chat and setting up socmed (including facebook, youtube and a couple others which probably aren't ready to be publicised yet). Today I'm hoping to add the chat visuals, and maybe start designing some branding if the laptop can handle it. Let's get to work!
`);
}
//👶 I\'m a new channel, say hi in chat! 👶
