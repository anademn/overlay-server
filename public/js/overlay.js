// Overlay design
overlay.on('set-chroma', function (colour) {
  let ctx = this.ctx;
  ctx.fillStyle = colour || '#00b140';
  ctx.fillRect(0, 0, 1920, 1080)
})

.on('textbox', function (bgColor, text) {
  let ctx = this.ctx, width = 380, height, top, textColor = '#fff',
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
  ctx.fillStyle = bgColor || '#00b1a8';
  ctx.fillRect(1920 - width, top = 1080 - height, width, height);
  ctx.fillStyle = textColor || '#fff';
  top += padding + fontSize - lineHeight;
  lines.forEach(line => ctx.fillText(line, 1920 - width + padding, (top += lineHeight)))
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
    document.title = 'Stream overlay | VISIBLE'
    setOverlay()
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

.on('chat', function (data) {
  console.log(data)
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

overlay.emit('blind', 'off');
function setOverlay () {
  overlay.emit('header', '#add8e6', '👶 I\'m a new channel, say hi in chat! 👶');
  overlay.emit('textbox', '#00b1a8',`
• Stream #10, 15 Jul 2018
`);
}
