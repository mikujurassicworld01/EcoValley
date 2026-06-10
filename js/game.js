
function Game() {
  this.canvas = document.getElementById('canvas');
  this.ctx    = this.canvas.getContext('2d');

  this.canvas.width  = CANVAS_WIDTH;
  this.canvas.height = CANVAS_HEIGHT;
  this._resize();
  window.addEventListener('resize', this._resize.bind(this));

  /* state */
  this.money   = INITIAL_MONEY;
  this.ecology = INITIAL_ECOLOGY;
  this.inv     = { soja: 0, morango: 0, abobora: 0 };

  /* subsystems */
  this.player  = new Player(
    PLAYER_START_COL * TILE_SIZE + TILE_SIZE/2 - PLAYER_W/2,
    PLAYER_START_ROW * TILE_SIZE + TILE_SIZE/2 - PLAYER_H/2
  );
  this.world   = new World();
  this.crops   = new CropManager();
  this.weather = new WeatherSystem();
  this.ui      = new UI(this);
  this.shop    = new Shop(this);

  /* runtime */
  this.keys        = {};
  /* initialise camera centred on player */
  var maxCX = WORLD_COLS * TILE_SIZE - CANVAS_WIDTH;
  var maxCY = WORLD_ROWS * TILE_SIZE - VIEWPORT_H;
  this.camX = Math.max(0, Math.min(maxCX, this.player.wx + this.player.w/2 - CANVAS_WIDTH/2));
  this.camY = Math.max(0, Math.min(maxCY, this.player.wy + this.player.h/2 - VIEWPORT_H/2));
  this.running     = false;
  this.lastTime    = 0;
  this.hovCol      = -1;
  this.hovRow      = -1;
  this._justUsed   = false; /* debounce SPACE */

  this._bindEvents();
}

/* ─── Resize ─────────────────────────────────────────────────────── */
Game.prototype._resize = function() {
  var scaleX = window.innerWidth / CANVAS_WIDTH;
  var scaleY = window.innerHeight / CANVAS_HEIGHT;
  var scale = Math.min(scaleX, scaleY);

  this.canvas.style.width  = (CANVAS_WIDTH * scale) + 'px';
  this.canvas.style.height = (CANVAS_HEIGHT * scale) + 'px';
};

/* ─── Events ─────────────────────────────────────────────────────── */
Game.prototype._bindEvents = function() {
  var self = this;

  window.addEventListener('keydown', function(e) {
    self.keys[e.key] = true;

    /* digit keys 1-9: select tool */
    if (e.key >= '1' && e.key <= '9') {
      var slot = parseInt(e.key) - 1;
      if (slot < TOOL_SLOTS) {
        self.player.activeTool = slot;
        var label = TOOL_LABEL[slot];
        if (label && label !== '—') { self.ui.showMessage(label + ' equipado'); }
      }
    }

    /* E: interact with building */
    if (e.key === 'e' || e.key === 'E') {
      if (self.world.isNearShop(self.player)) { self.shop.show(); }
      else if (self.world.isNearHouse(self.player)) { self._sleep(); }
    }

    /* SPACE: use tool on facing tile */
    if (e.key === ' ' && !self._justUsed) {
      self._justUsed = true;
      self._useToolOnFacing();
    }

    var prevent = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '];
    if (prevent.indexOf(e.key) !== -1) { e.preventDefault(); }
  });

  window.addEventListener('keyup', function(e) {
    self.keys[e.key] = false;
    if (e.key === ' ') { self._justUsed = false; }
  });

  /* canvas click */
this.canvas.addEventListener('click', function(e) {
  if (!document.getElementById('loja').classList.contains('hidden')) return;

  var pos = self._canvasPos(e);

  if (pos.y >= HUD_Y) return;

  var col = Math.floor((pos.x + self.camX) / TILE_SIZE);
  var row = Math.floor((pos.y + self.camY) / TILE_SIZE);

  if (self._isReachable(col, row)) {
    self._useToolOn(col, row);
  } else {
    self.ui.showMessage('Muito longe! Aproxime-se.');
  }
});


/* mousemove */
this.canvas.addEventListener('mousemove', function(e) {
  var pos = self._canvasPos(e);

  if (pos.y >= HUD_Y) {
    self.hovCol = -1;
    self.hovRow = -1;
    return;
  }

  self.hovCol = Math.floor((pos.x + self.camX) / TILE_SIZE);
  self.hovRow = Math.floor((pos.y + self.camY) / TILE_SIZE);

  self.canvas.style.cursor =
    self._isReachable(self.hovCol, self.hovRow) ? 'pointer' : 'default';
});
  /* shop buttons */
  document.getElementById('btn-fechar-loja').addEventListener('click', function() { self.shop.hide(); });

  document.getElementById('btn-comprar-adubo').addEventListener('click', function() {
    if (self.money < FERTILIZER_COST) { return; }
    self.money -= FERTILIZER_COST;
    var cnt = 0;
    for (var r = 0; r < WORLD_ROWS; r++) for (var c = 0; c < WORLD_COLS; c++) {
      var crop = self.crops.grid[r][c];
      if (crop && crop.stage < CROP_READY) {
        crop.timer += CROP_DATA[crop.type].stages[crop.stage] * 0.35;
        cnt++;
      }
    }
    self.shop._refresh();
    self.ui.showMessage('Adubo aplicado! ' + cnt + ' plantas aceleradas.');
  });

  document.getElementById('btn-reparar-solo').addEventListener('click', function() {
    if (self.money < SOIL_REPAIR_COST) { return; }
    self.money -= SOIL_REPAIR_COST;
    self.ecology = Math.min(100, self.ecology + 22);
    /* restore all tilled tiles */
    for (var r = 0; r < WORLD_ROWS; r++) for (var c = 0; c < WORLD_COLS; c++) {
      if (self.world.map[r][c] === T_TILLED || self.world.map[r][c] === T_WATERED) {
        if (self.crops.grid[r][c]) { self.crops.grid[r][c].fertile = true; }
      }
    }
    self.shop._refresh();
    self.ui.showMessage('Solo recuperado! +22% ecologia!');
  });
};

/* ─── Tool use ───────────────────────────────────────────────────── */
Game.prototype._useToolOnFacing = function() {
  var ft = this.player.facingTile();
  this._useToolOn(ft.col, ft.row);
};

Game.prototype._useToolOn = function(col, row) {
  if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) { return; }
  var tool = this.player.activeTool;
  var tile = this.world.getTile(col, row);

  if (!this.player.useTool()) {
    this.ui.showMessage('⚡ Sem energia! Durma na casa para recuperar.');
    return;
  }

  if (tool === TOOL_HOE) {
    if (tile === T_FARMLAND) {
      this.world.setTile(col, row, T_TILLED);
      this.ui.showMessage('Solo lavrado!');
    } else if (tile === T_GRASS) {
      this.ui.showMessage('Só é possível lavrar terreno da fazenda.');
    } else {
      this.ui.showMessage('Nada para lavrar aqui.');
    }

  } else if (tool === TOOL_WATER) {
    if (this.crops.water(col, row, this.world.map)) {
      this.ui.showMessage('Regado! Crescimento acelerado 🌧');
    } else if (tile === T_FARMLAND) {
      this.ui.showMessage('Lave o solo primeiro com a enxada.');
    } else {
      this.ui.showMessage('Nada para regar aqui.');
    }

  } else if (tool === TOOL_SOY || tool === TOOL_BERRY || tool === TOOL_PUMPKIN) {
    var cropType = tool === TOOL_SOY ? CROP_SOY : tool === TOOL_BERRY ? CROP_STRAWBERRY : CROP_PUMPKIN;
    if (tile !== T_TILLED && tile !== T_WATERED) {
      this.ui.showMessage('Lave o solo primeiro com a enxada!');
      return;
    }
    if (this.crops.grid[row][col]) {
      this.ui.showMessage('Já tem uma planta aqui!');
      return;
    }
    if (this.crops.plant(col, row, cropType, this.world.map)) {
      var cname = cropType === CROP_SOY ? 'Soja' : cropType === CROP_STRAWBERRY ? 'Morango' : 'Abóbora';
      this.ui.showMessage(cname + ' plantada! 🌱');
    }

  } else if (tool === TOOL_SCYTHE) {
    var crop = this.crops.grid[row][col];
    if (!crop) { this.ui.showMessage('Nada para colher aqui.'); return; }
    if (crop.stage !== CROP_READY) {
      var pct = 0;
      var stageTotal = CROP_DATA[crop.type].stages[crop.stage];
      pct = Math.round(crop.timer / stageTotal * 100);
      this.ui.showMessage('Ainda crescendo... ' + pct + '% do estágio atual.');
      return;
    }
    var harvested = this.crops.harvest(col, row);
    if (harvested) {
      this.inv[harvested]++;
      var data = CROP_DATA[harvested];
      this.ecology = Math.max(0, Math.min(100, this.ecology + data.ecology));
      var hname = harvested === CROP_SOY ? 'Soja' : harvested === CROP_STRAWBERRY ? 'Morango' : 'Abóbora';
      this.ui.showMessage('+1 ' + hname + ' colhido! Venda na loja. (R$' + data.sell + ')');
      if (harvested === CROP_SOY && Math.random() < 0.3) {
        this.ui.showMessage('⚠ Solo levemente degradado! Use recuperador.', 4000);
      }
      /* return tile to tilled */
      this.world.setTile(col, row, T_TILLED);
    }
  }
};

Game.prototype._isReachable = function(col, row) {
  var pc = this.player.tileCol();
  var pr = this.player.tileRow();
  return Math.abs(col-pc) <= 2 && Math.abs(row-pr) <= 2;
};

/* ─── Sleep ──────────────────────────────────────────────────────── */
Game.prototype._sleep = function() {
  this.player.energy = MAX_ENERGY;
  this.weather.advanceDay();
  this.ui.showMessage(
    '💤 Bom descanso! Dia ' + this.weather.day + ' — ' + SEASON_NAMES[this.weather.season]
  );
};

/* ─── Camera ─────────────────────────────────────────────────────── */
Game.prototype._updateCamera = function() {
  var tx = this.player.wx + this.player.w/2 - CANVAS_WIDTH/2;
  var ty = this.player.wy + this.player.h/2 - VIEWPORT_H/2;
  var maxX = WORLD_COLS * TILE_SIZE - CANVAS_WIDTH;
  var maxY = WORLD_ROWS * TILE_SIZE - VIEWPORT_H;
  this.camX += (Math.max(0, Math.min(maxX, tx)) - this.camX) * 0.12;
  this.camY += (Math.max(0, Math.min(maxY, ty)) - this.camY) * 0.12;
};

/* ─── Canvas coords ──────────────────────────────────────────────── */
Game.prototype._canvasPos = function(e) {
  var rect = this.canvas.getBoundingClientRect();

  return {
    x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
    y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
  };
};
/* ─── Start ──────────────────────────────────────────────────────── */
Game.prototype.start = function() {
  this.running  = true;
  this.lastTime = performance.now();
  requestAnimationFrame(this._loop.bind(this));
};

Game.prototype._loop = function(ts) {
  if (!this.running) { return; }
  var dt = Math.min(120, ts - this.lastTime);
  this.lastTime = ts;
  this._update(dt);
  this._draw();
  requestAnimationFrame(this._loop.bind(this));
};

/* ─── Update ─────────────────────────────────────────────────────── */
Game.prototype._update = function(dt) {
  var shopOpen = !document.getElementById('loja').classList.contains('hidden');
  if (!shopOpen) {
    this.player.update(this.keys, dt, this.world);
  }
  this._updateCamera();
  this.world.update(dt);
  this.weather.update(dt);
  this.crops.update(dt, this.world.map, this.weather.current);
  this.ui.update(dt);
};

/* ─── Draw ───────────────────────────────────────────────────────── */
Game.prototype._draw = function() {
  var ctx  = this.ctx;
  var camX = this.camX;
  var camY = this.camY;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  /* sky */
  this.weather.drawSky(ctx);

  /* world tiles */
  this.world.draw(ctx, camX, camY, this.weather.season, this.weather.current);

  /* crop tiles + hover highlights */
  var startC = Math.max(0, Math.floor(camX / TILE_SIZE));
  var endC   = Math.min(WORLD_COLS, Math.ceil((camX + CANVAS_WIDTH) / TILE_SIZE) + 1);
  var startR = Math.max(0, Math.floor(camY / TILE_SIZE));
  var endR   = Math.min(WORLD_ROWS, Math.ceil((camY + VIEWPORT_H) / TILE_SIZE) + 1);

  for (var r = startR; r < endR; r++) {
    for (var c = startC; c < endC; c++) {
      var hov = (c === this.hovCol && r === this.hovRow && this._isReachable(c, r));
      this.crops.draw(ctx, c, r, camX, camY, hov);
      if (hov) {
        this.ui.drawTileHint(ctx, c, r, camX, camY, this.player.activeTool);
      }
    }
  }

  /* buildings drawn after ground/crops */
  this.world.drawBuildings(ctx, camX, camY);

  /* player */
  this.player.draw(ctx, camX, camY);

  /* ui / HUD */
  this.ui.draw(ctx);

  /* world border vignette */
  this._drawVignette(ctx);
};

Game.prototype._drawVignette = function(ctx) {
  var grad = ctx.createRadialGradient(
    CANVAS_WIDTH/2, VIEWPORT_H/2, VIEWPORT_H*0.35,
    CANVAS_WIDTH/2, VIEWPORT_H/2, VIEWPORT_H*0.72
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, VIEWPORT_H);
};
