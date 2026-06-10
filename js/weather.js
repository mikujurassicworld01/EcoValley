function WeatherSystem() {
  this.current  = WEATHER_SUNNY;
  this.timer    = 0;
  this.day      = 1;
  this.season   = SEASON_SPRING;
  this.options  = [WEATHER_SUNNY, WEATHER_SUNNY, WEATHER_CLOUDY, WEATHER_RAINY];
  this.clouds   = [];
  this.raindrops = [];
  this._initClouds();
  this._initRain();
}

WeatherSystem.prototype._initClouds = function() {
  for (var i = 0; i < 7; i++) {
    this.clouds.push({
      x: Math.random() * CANVAS_WIDTH,
      y: 20 + Math.random() * 80,
      w: 80 + Math.random() * 100,
      h: 28 + Math.random() * 24,
      spd: 0.15 + Math.random() * 0.25
    });
  }
};

WeatherSystem.prototype._initRain = function() {
  for (var i = 0; i < 140; i++) {
    this.raindrops.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * VIEWPORT_H,
      spd: 5 + Math.random() * 5,
      len: 9 + Math.random() * 9
    });
  }
};

WeatherSystem.prototype.update = function(dt) {
  var i;
  this.timer += dt;
  if (this.timer >= WEATHER_INTERVAL) {
    this.timer = 0;
    var prev = this.current;
    var tries = 0;
    while (this.current === prev && tries < 10) {
      this.current = this.options[Math.floor(Math.random() * this.options.length)];
      tries++;
    }
    return true; /* changed */
  }

  /* move clouds */
  for (i = 0; i < this.clouds.length; i++) {
    this.clouds[i].x += this.clouds[i].spd;
    if (this.clouds[i].x > CANVAS_WIDTH + 120) {
      this.clouds[i].x = -120;
      this.clouds[i].y = 20 + Math.random() * 80;
    }
  }

  /* move raindrops */
  if (this.current === WEATHER_RAINY) {
    for (i = 0; i < this.raindrops.length; i++) {
      this.raindrops[i].y += this.raindrops[i].spd;
      this.raindrops[i].x += 1.4;
      if (this.raindrops[i].y > VIEWPORT_H + 12) {
        this.raindrops[i].y = -16;
        this.raindrops[i].x = Math.random() * CANVAS_WIDTH;
      }
    }
  }

  return false;
};

WeatherSystem.prototype.advanceDay = function() {
  this.day++;
  if (this.day > DAYS_PER_SEASON) {
    this.day    = 1;
    this.season = (this.season + 1) % 4;
  }
  /* randomise next day weather */
  this.current = this.options[Math.floor(Math.random() * this.options.length)];
};

WeatherSystem.prototype.drawSky = function(ctx) {
  var isRain = this.current === WEATHER_RAINY;
  var grad = ctx.createLinearGradient(0, 0, 0, VIEWPORT_H);
  if (isRain) {
    grad.addColorStop(0, '#303848');
    grad.addColorStop(1, '#586070');
  } else if (this.current === WEATHER_CLOUDY) {
    grad.addColorStop(0, '#6898c0');
    grad.addColorStop(1, '#90b8d8');
  } else {
    var s = this.season;
    var tops    = ['#3876c0','#2060b0','#3060a8','#4060a0'];
    var bottoms = ['#78aee0','#60a0d0','#8098c8','#8898b8'];
    grad.addColorStop(0, tops[s]);
    grad.addColorStop(1, bottoms[s]);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, VIEWPORT_H);

  /* sun */
  if (this.current === WEATHER_SUNNY) {
    var sx = CANVAS_WIDTH - 80, sy = 55;
    ctx.fillStyle = 'rgba(255,240,100,0.18)';
    ctx.beginPath(); ctx.arc(sx, sy, 46, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2;
    for (var r = 0; r < 8; r++) {
      var a = (r/8)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(sx+Math.cos(a)*34, sy+Math.sin(a)*34);
      ctx.lineTo(sx+Math.cos(a)*44, sy+Math.sin(a)*44);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffe84a';
    ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.beginPath(); ctx.arc(sx-8, sy-7, 10, 0, Math.PI*2); ctx.fill();
  }

  /* clouds */
  var cAlpha = isRain ? 0.85 : 0.88;
  var cColor = isRain ? 'rgba(90,100,115,' : 'rgba(240,248,255,';
  for (var i = 0; i < this.clouds.length; i++) {
    var c = this.clouds[i];
    ctx.fillStyle = cColor + cAlpha + ')';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w/2, c.h/2, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x-c.w*0.26, c.y+4, c.w*0.32, c.h*0.46, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x+c.w*0.26, c.y+5, c.w*0.30, c.h*0.44, 0, 0, Math.PI*2); ctx.fill();
  }

  /* rain */
  if (isRain) {
    ctx.strokeStyle = 'rgba(160,200,255,0.5)'; ctx.lineWidth = 1.2;
    for (var j = 0; j < this.raindrops.length; j++) {
      var rd = this.raindrops[j];
      ctx.beginPath();
      ctx.moveTo(rd.x, rd.y);
      ctx.lineTo(rd.x+2, rd.y+rd.len);
      ctx.stroke();
    }
  }
};

WeatherSystem.prototype.getIcon = function() {
  if (this.current === WEATHER_SUNNY)  { return '\u2600\uFE0F'; }
  if (this.current === WEATHER_RAINY)  { return '\uD83C\uDF27\uFE0F'; }
  return '\u26C5';
};

WeatherSystem.prototype.getLabel = function() {
  if (this.current === WEATHER_SUNNY) { return 'Sol'; }
  if (this.current === WEATHER_RAINY) { return 'Chuva'; }
  return 'Nublado';
};

WeatherSystem.prototype.getDateText = function() {
  return 'Dia ' + this.day + ' \u2014 ' + SEASON_NAMES[this.season] + ' ' + SEASON_ICONS[this.season];
};
