function World() {
  this.map = this._buildMap();
  this._noiseCache = this._buildNoise();
  this.waterAnim = 0;
}

/* ─── Map generation ────────────────────────────────────────────── */
World.prototype._buildMap = function() {
  var r, c, map = [];
  for (r = 0; r < WORLD_ROWS; r++) {
    map[r] = [];
    for (c = 0; c < WORLD_COLS; c++) { map[r][c] = T_GRASS; }
  }

  /* border trees */
  for (r = 0; r < WORLD_ROWS; r++) for (c = 0; c < WORLD_COLS; c++) {
    if (r < 2 || r >= WORLD_ROWS-2 || c < 2 || c >= WORLD_COLS-2) map[r][c] = T_TREE;
  }

  /* dense interior tree columns left/right */
  for (r = 2; r < WORLD_ROWS-2; r++) {
    if (r < HOUSE_R || r >= HOUSE_R+HOUSE_RH+3) { map[r][2] = T_TREE; }
    if (r < SHOP_R  || r >= SHOP_R +SHOP_RH +3) { map[r][WORLD_COLS-3] = T_TREE; }
  }

  /* scattered trees in open areas */
  var treeSpots = [
    [3,18],[3,24],[3,30],[3,36],[4,8],[4,38],[5,8],[5,38],
    [14,3],[14,4],[15,3],[16,3],[16,4],[17,3],[17,4],
    [14,43],[15,44],[16,43],[17,43],[17,44],
    [18,6],[18,8],[18,10],[18,12],[18,14],[18,16],[18,18],
    [18,20],[18,22],[18,24],[18,26],[18,28],[18,30],
    [18,32],[18,34],[18,36],[18,38],[18,40],[18,42],
    [19,5],[19,7],[19,9],[19,11],[19,13],[19,15],[19,17],[19,19],
    [19,21],[19,23],[19,25],[19,27],[19,29],[19,31],[19,33],
    [20,4],[20,6],[20,8],[20,10],[20,12],[20,14],[20,16],[20,18],
    [20,20],[20,22],[20,24],[20,26],[20,28],[20,30],[20,32],[20,34],
    [21,5],[21,7],[21,9],[21,11],[21,13],[21,15],[21,17],[21,19],
    [21,21],[21,23],[21,25],[21,27],[21,29],[21,31],[21,33],
    [22,4],[22,6],[22,8],[22,10],[22,12],[22,14],[22,16],[22,18],
    [22,20],[22,22],[22,24],[22,26],[22,28],[22,30],[22,32],[22,34],
    [23,5],[23,7],[23,9],[23,11],[23,13],[23,15],[23,17],[23,19],[23,21],[23,23],[23,25],[23,27],
    [24,4],[24,6],[24,8],[24,10],[24,12],[24,14],[24,16],[24,18],[24,20],[24,22],[24,24],[24,26],
    [25,5],[25,7],[25,9],[25,11],[25,13],[25,15],[25,17]
  ];
  for (var t = 0; t < treeSpots.length; t++) {
    r = treeSpots[t][0]; c = treeSpots[t][1];
    if (r >= 0 && r < WORLD_ROWS && c >= 0 && c < WORLD_COLS && map[r][c] === T_GRASS) map[r][c] = T_TREE;
  }

  /* flowers */
  var flowers = [
    [3,12],[3,20],[3,28],[4,10],[4,35],[5,10],[5,35],
    [14,6],[14,8],[14,42],[14,44],[15,5],[15,6],[15,44],
    [17,12],[17,16],[17,20],[17,32],[17,36],[17,40]
  ];
  for (var fl = 0; fl < flowers.length; fl++) {
    r = flowers[fl][0]; c = flowers[fl][1];
    if (r >= 0 && r < WORLD_ROWS && c >= 0 && c < WORLD_COLS && map[r][c] === T_GRASS) map[r][c] = T_FLOWER;
  }

  /* stump decorations */
  var stumps = [[15,7],[15,42],[16,6]];
  for (var st = 0; st < stumps.length; st++) {
    r = stumps[st][0]; c = stumps[st][1];
    if (map[r][c] === T_GRASS) map[r][c] = T_STUMP;
  }

  /* main road: rows 15-16 */
  for (c = 2; c < WORLD_COLS-2; c++) { map[15][c] = T_PATH; map[16][c] = T_PATH; }

  /* farm area */
  for (r = FARM_R0; r <= FARM_R1; r++)
    for (c = FARM_C0; c <= FARM_C1; c++) map[r][c] = T_FARMLAND;

  /* farm fence */
  for (c = FARM_C0-1; c <= FARM_C1+1; c++) {
    map[FARM_R0-1][c] = T_FENCE_H;
    map[FARM_R1+1][c] = T_FENCE_H;
  }
  for (r = FARM_R0; r <= FARM_R1; r++) {
    map[r][FARM_C0-1] = T_FENCE_V;
    map[r][FARM_C1+1] = T_FENCE_V;
  }
  /* fence corners */
  map[FARM_R0-1][FARM_C0-1] = T_FENCE_H;
  map[FARM_R0-1][FARM_C1+1] = T_FENCE_H;
  map[FARM_R1+1][FARM_C0-1] = T_FENCE_H;
  map[FARM_R1+1][FARM_C1+1] = T_FENCE_H;

  /* gate openings in fence */
  var GATE = 23;
  map[FARM_R0-1][GATE] = T_PATH; map[FARM_R0-1][GATE+1] = T_PATH;
  map[FARM_R1+1][GATE] = T_PATH; map[FARM_R1+1][GATE+1] = T_PATH;

  /* path farm→road */
  for (r = FARM_R1+2; r <= 15; r++) { map[r][GATE] = T_PATH; map[r][GATE+1] = T_PATH; }

  /* house building footprint */
  for (r = HOUSE_R; r < HOUSE_R+HOUSE_RH; r++)
    for (c = HOUSE_C; c < HOUSE_C+HOUSE_CW; c++) map[r][c] = T_BUILDING;
  /* door tile accessible */
  var HOUSE_DOOR_COL = HOUSE_C + Math.floor(HOUSE_CW/2);
  map[HOUSE_R+HOUSE_RH-1][HOUSE_DOOR_COL]   = T_PATH;
  map[HOUSE_R+HOUSE_RH-1][HOUSE_DOOR_COL+1] = T_PATH;
  /* path south from house door to road */
  for (r = HOUSE_R+HOUSE_RH; r <= 16; r++) { map[r][HOUSE_DOOR_COL] = T_PATH; }

  /* shop building footprint */
  for (r = SHOP_R; r < SHOP_R+SHOP_RH; r++)
    for (c = SHOP_C; c < SHOP_C+SHOP_CW; c++) map[r][c] = T_BUILDING;
  var SHOP_DOOR_COL = SHOP_C + Math.floor(SHOP_CW/2);
  map[SHOP_R+SHOP_RH-1][SHOP_DOOR_COL]   = T_PATH;
  map[SHOP_R+SHOP_RH-1][SHOP_DOOR_COL+1] = T_PATH;
  for (r = SHOP_R+SHOP_RH; r <= 15; r++) { map[r][SHOP_DOOR_COL] = T_PATH; }

  /* pond */
  for (r = POND_R; r < POND_R+POND_RH; r++)
    for (c = POND_C; c < POND_C+POND_CW; c++) map[r][c] = T_WATER;
  /* sand ring */
  for (r = POND_R-1; r <= POND_R+POND_RH; r++)
    for (c = POND_C-1; c <= POND_C+POND_CW; c++) {
      if (map[r][c] === T_GRASS) map[r][c] = T_SAND;
    }

  return map;
};

World.prototype._buildNoise = function() {
  var cache = [];
  for (var r = 0; r < WORLD_ROWS; r++) {
    cache[r] = [];
    for (var c = 0; c < WORLD_COLS; c++) {
      cache[r][c] = [];
      for (var k = 0; k < 8; k++) { cache[r][c].push(Math.random()); }
    }
  }
  return cache;
};

/* ─── Update ────────────────────────────────────────────────────── */
World.prototype.update = function(dt) {
  this.waterAnim = (this.waterAnim + dt * 0.0015) % (Math.PI * 2);
};

/* ─── Draw world ────────────────────────────────────────────────── */
World.prototype.draw = function(ctx, camX, camY, season, weather) {
  /* sky is drawn by weather system */
  var startC = Math.max(0, Math.floor(camX / TILE_SIZE));
  var endC   = Math.min(WORLD_COLS, Math.ceil((camX + CANVAS_WIDTH) / TILE_SIZE) + 1);
  var startR = Math.max(0, Math.floor(camY / TILE_SIZE));
  var endR   = Math.min(WORLD_ROWS, Math.ceil((camY + VIEWPORT_H) / TILE_SIZE) + 1);

  /* pass 1: ground tiles */
  for (var r = startR; r < endR; r++) {
    for (var c = startC; c < endC; c++) {
      var sx = Math.round(c * TILE_SIZE - camX);
      var sy = Math.round(r * TILE_SIZE - camY);
      this._drawGroundTile(ctx, this.map[r][c], sx, sy, r, c, season);
    }
  }

  /* pass 2: trees (drawn as tall objects, top-sorted) */
  for (var r2 = startR; r2 < endR; r2++) {
    for (var c2 = startC; c2 < endC; c2++) {
      var t = this.map[r2][c2];
      if (t === T_TREE) {
        var tx = Math.round(c2 * TILE_SIZE - camX);
        var ty = Math.round(r2 * TILE_SIZE - camY);
        this._drawTree(ctx, tx, ty, r2, c2, season);
      }
    }
  }
};

/* ─── Draw buildings (called after player) ──────────────────────── */
World.prototype.drawBuildings = function(ctx, camX, camY) {
  var hx = Math.round(HOUSE_C * TILE_SIZE - camX);
  var hy = Math.round(HOUSE_R * TILE_SIZE - camY);
  this._drawHouse(ctx, hx, hy);

  var sx = Math.round(SHOP_C * TILE_SIZE - camX);
  var sy = Math.round(SHOP_R * TILE_SIZE - camY);
  this._drawShop(ctx, sx, sy);
};

/* ─── Tile renderer ─────────────────────────────────────────────── */
World.prototype._drawGroundTile = function(ctx, type, sx, sy, row, col, season) {
  var ts = TILE_SIZE;
  var n  = this._noiseCache[row][col];

  switch (type) {
    case T_GRASS:
    case T_FLOWER:
    case T_STUMP:
    case T_TALL_GRASS: {
      ctx.fillStyle = SEASON_GRASS_COLOR[season];
      ctx.fillRect(sx, sy, ts, ts);
      /* noise blades */
      ctx.fillStyle = SEASON_GRASS_DARK[season];
      ctx.fillRect(sx + Math.floor(n[0]*24), sy + Math.floor(n[1]*20), 2, 5);
      ctx.fillRect(sx + Math.floor(n[2]*22)+6, sy + Math.floor(n[3]*18)+6, 2, 4);
      ctx.fillRect(sx + Math.floor(n[4]*20)+2, sy + Math.floor(n[5]*18)+10, 2, 5);
      ctx.fillRect(sx + Math.floor(n[6]*22)+8, sy + Math.floor(n[7]*16)+14, 2, 4);
      if (type === T_FLOWER) {
        var fc = ['#fbbf24','#f87171','#818cf8','#34d399','#fb923c'][Math.floor(n[0]*5)];
        ctx.fillStyle = fc;
        ctx.fillRect(sx + 12 + Math.floor(n[1]*8), sy + 14 + Math.floor(n[2]*8), 4, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx + 13 + Math.floor(n[1]*8), sy + 15 + Math.floor(n[2]*8), 2, 2);
      }
      if (type === T_STUMP) {
        ctx.fillStyle = '#7a5a3a'; ctx.fillRect(sx+10, sy+16, 12, 10);
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(sx+11, sy+17, 10, 8);
        ctx.fillStyle = '#9a7a5a'; ctx.fillRect(sx+12, sy+18, 4, 6);
      }
      break;
    }
    case T_FARMLAND: {
      ctx.fillStyle = SEASON_FARMLAND[season];
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(sx + Math.floor(n[0]*18), sy + Math.floor(n[1]*16), 8, 6);
      ctx.fillRect(sx + Math.floor(n[2]*16)+8, sy + Math.floor(n[3]*14)+8, 6, 4);
      break;
    }
    case T_TILLED: {
      ctx.fillStyle = '#4f3218';
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = '#2e1c0a';
      for (var fi = 0; fi < 4; fi++) {
        ctx.fillRect(sx+2, sy+4+fi*7, ts-4, 2);
      }
      ctx.fillStyle = '#7a5038';
      ctx.fillRect(sx+3, sy+5, ts-6, 1);
      ctx.fillRect(sx+3, sy+12, ts-6, 1);
      break;
    }
    case T_WATERED: {
      ctx.fillStyle = '#2c1a0a';
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = '#180e04';
      for (var wi = 0; wi < 4; wi++) {
        ctx.fillRect(sx+2, sy+4+wi*7, ts-4, 2);
      }
      ctx.fillStyle = 'rgba(80,140,220,0.12)';
      ctx.fillRect(sx, sy, ts, ts);
      break;
    }
    case T_WATER: {
      var pulse = Math.sin(this.waterAnim + n[0]*Math.PI);
      ctx.fillStyle = '#1a5a96';
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = 'rgba(100,170,240,0.35)';
      ctx.fillRect(sx+2, sy+6+(pulse*2|0), ts-4, 6);
      ctx.fillRect(sx+4, sy+18+(pulse*1.5|0), ts-8, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(sx+6+(n[1]*8|0), sy+8, 4, 2);
      ctx.fillRect(sx+14+(n[2]*6|0), sy+20, 4, 2);
      break;
    }
    case T_PATH: {
      ctx.fillStyle = '#a09070';
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = '#887858';
      ctx.fillRect(sx+1, sy+1, ts/2-2, ts/2-2);
      ctx.fillRect(sx+ts/2+1, sy+ts/2+1, ts/2-2, ts/2-2);
      ctx.fillStyle = '#baa880';
      ctx.fillRect(sx+2, sy+2, 5, 3);
      ctx.fillRect(sx+ts/2+2, sy+ts/2+2, 5, 3);
      ctx.fillStyle = '#7a6848';
      ctx.fillRect(sx, sy+ts/2-1, ts, 2);
      ctx.fillRect(sx+ts/2-1, sy, 2, ts);
      break;
    }
    case T_SAND: {
      ctx.fillStyle = '#c8b070';
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = '#b09850';
      ctx.fillRect(sx+Math.floor(n[0]*20), sy+Math.floor(n[1]*18), 4, 4);
      break;
    }
    case T_FENCE_H: {
      ctx.fillStyle = SEASON_GRASS_COLOR[season];
      ctx.fillRect(sx, sy, ts, ts);
      /* horizontal rail */
      ctx.fillStyle = '#c4874a';
      ctx.fillRect(sx, sy+9, ts, 5);
      ctx.fillRect(sx, sy+18, ts, 5);
      ctx.fillStyle = '#a86830';
      ctx.fillRect(sx, sy+10, ts, 2);
      ctx.fillRect(sx, sy+19, ts, 2);
      /* post */
      ctx.fillStyle = '#8b5a28';
      ctx.fillRect(sx+2, sy+4, 5, 24);
      ctx.fillRect(sx+ts-7, sy+4, 5, 24);
      ctx.fillStyle = '#c4874a';
      ctx.fillRect(sx+3, sy+5, 3, 22);
      ctx.fillRect(sx+ts-6, sy+5, 3, 22);
      break;
    }
    case T_FENCE_V: {
      ctx.fillStyle = SEASON_GRASS_COLOR[season];
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = '#c4874a';
      ctx.fillRect(sx+9, sy, 5, ts);
      ctx.fillRect(sx+18, sy, 5, ts);
      ctx.fillStyle = '#a86830';
      ctx.fillRect(sx+10, sy, 2, ts);
      ctx.fillRect(sx+19, sy, 2, ts);
      ctx.fillStyle = '#8b5a28';
      ctx.fillRect(sx+4, sy+2, 24, 5);
      ctx.fillRect(sx+4, sy+ts-7, 24, 5);
      ctx.fillStyle = '#c4874a';
      ctx.fillRect(sx+5, sy+3, 22, 3);
      ctx.fillRect(sx+5, sy+ts-6, 22, 3);
      break;
    }
    case T_BUILDING: {
      ctx.fillStyle = '#a0907a';
      ctx.fillRect(sx, sy, ts, ts);
      break;
    }
    case T_ROCK: {
      ctx.fillStyle = SEASON_GRASS_COLOR[season];
      ctx.fillRect(sx, sy, ts, ts);
      ctx.fillStyle = '#888080';
      ctx.beginPath(); ctx.ellipse(sx+ts/2, sy+ts/2+2, 12, 9, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#aaa898';
      ctx.beginPath(); ctx.ellipse(sx+ts/2-2, sy+ts/2, 8, 6, 0, 0, Math.PI*2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = SEASON_GRASS_COLOR[season];
      ctx.fillRect(sx, sy, ts, ts);
    }
  }
};

World.prototype._drawTree = function(ctx, sx, sy, row, col, season) {
  var ts = TILE_SIZE;
  var n  = this._noiseCache[row][col];
  var seasonFoliage = ['#2a6a14','#1a5808','#7a6010','#b8c8d8'];
  var seasonDark    = ['#1a4a0a','#0e3808','#5a4808','#98a8b8'];
  var foliageColor  = seasonFoliage[season];
  var darkColor     = seasonDark[season];

  /* trunk */
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(sx+ts/2-4, sy+ts/2, 8, ts/2+2);
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(sx+ts/2-3, sy+ts/2+2, 3, ts/2-1);

  /* shadow ellipse */
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath(); ctx.ellipse(sx+ts/2, sy+ts-4, 9, 4, 0, 0, Math.PI*2); ctx.fill();

  /* foliage layers */
  var r = (12 + n[0]*8)|0;
  ctx.fillStyle = darkColor;
  ctx.beginPath(); ctx.arc(sx+ts/2, sy+ts*0.35, r+2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = foliageColor;
  ctx.beginPath(); ctx.arc(sx+ts/2, sy+ts*0.32, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = darkColor;
  ctx.beginPath(); ctx.arc(sx+ts/2-(4+n[1]*4|0), sy+ts*0.45, (r*0.7)|0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx+ts/2+(4+n[2]*4|0), sy+ts*0.42, (r*0.65)|0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = foliageColor;
  ctx.beginPath(); ctx.arc(sx+ts/2-(3+n[3]*3|0), sy+ts*0.43, (r*0.6)|0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx+ts/2+(3+n[4]*3|0), sy+ts*0.40, (r*0.58)|0, 0, Math.PI*2); ctx.fill();

  /* highlight */
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.arc(sx+ts/2-(r*0.3)|0, sy+ts*0.2, (r*0.4)|0, 0, Math.PI*2); ctx.fill();
};

/* ─── House ─────────────────────────────────────────────────────── */
World.prototype._drawHouse = function(ctx, hx, hy) {
  var W = HOUSE_CW * TILE_SIZE;  /* 224 */
  var H = HOUSE_RH * TILE_SIZE;  /* 288 */
  if (hx + W < 0 || hx > CANVAS_WIDTH || hy + H < 0 || hy > VIEWPORT_H) { return; }

  /* foundation */
  ctx.fillStyle = '#b8a480'; ctx.fillRect(hx, hy+H-8, W, 10);

  /* walls */
  ctx.fillStyle = '#f5e8c8'; ctx.fillRect(hx, hy+80, W, H-80);
  ctx.fillStyle = '#e8d8b0'; ctx.fillRect(hx+W-16, hy+80, 16, H-80);

  /* roof */
  ctx.fillStyle = '#8b3a20';
  ctx.beginPath();
  ctx.moveTo(hx-16, hy+86);
  ctx.lineTo(hx+W/2, hy);
  ctx.lineTo(hx+W+16, hy+86);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6a2810';
  ctx.beginPath();
  ctx.moveTo(hx-16, hy+86); ctx.lineTo(hx+W/2, hy+2);
  ctx.lineTo(hx+W/2, hy+10); ctx.lineTo(hx-12, hy+88); ctx.closePath(); ctx.fill();

  /* dormer */
  ctx.fillStyle = '#6a2810'; ctx.fillRect(hx+W/2-22, hy+28, 44, 36);
  ctx.fillStyle = '#8b3a20'; ctx.beginPath(); ctx.moveTo(hx+W/2-28, hy+34); ctx.lineTo(hx+W/2, hy+16); ctx.lineTo(hx+W/2+28, hy+34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a8d8f0'; ctx.fillRect(hx+W/2-18, hy+30, 36, 30);
  ctx.strokeStyle = '#5a6870'; ctx.lineWidth = 2; ctx.strokeRect(hx+W/2-18, hy+30, 36, 30);
  ctx.beginPath(); ctx.moveTo(hx+W/2, hy+30); ctx.lineTo(hx+W/2, hy+60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx+W/2-18, hy+45); ctx.lineTo(hx+W/2+18, hy+45); ctx.stroke();

  /* chimney */
  ctx.fillStyle = '#a04030'; ctx.fillRect(hx+W-56, hy-22, 24, 52);
  ctx.fillStyle = '#802818'; ctx.fillRect(hx+W-60, hy-26, 32, 8);
  /* smoke */
  ctx.fillStyle = 'rgba(200,200,200,0.3)';
  ctx.beginPath(); ctx.arc(hx+W-44, hy-30, 7, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx+W-50, hy-40, 9, 0, Math.PI*2); ctx.fill();

  /* windows left */
  this._drawWindow(ctx, hx+18, hy+96, 44, 44);
  /* windows right */
  this._drawWindow(ctx, hx+W-62, hy+96, 44, 44);
  /* upper small windows */
  this._drawWindow(ctx, hx+24, hy+152, 36, 34);
  this._drawWindow(ctx, hx+W-60, hy+152, 36, 34);

  /* door */
  ctx.fillStyle = '#5a3010'; ctx.fillRect(hx+W/2-24, hy+H-90, 48, 90);
  ctx.fillStyle = '#3a1e08'; ctx.fillRect(hx+W/2-24, hy+H-90, 48, 5);
  ctx.fillStyle = '#7a4a20';
  ctx.beginPath(); ctx.arc(hx+W/2, hy+H-90, 24, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(hx+W/2-20, hy+H-82, 18, 36);
  ctx.fillRect(hx+W/2+2, hy+H-82, 18, 36);
  ctx.fillStyle = '#d4a040';
  ctx.beginPath(); ctx.arc(hx+W/2+16, hy+H-60, 5, 0, Math.PI*2); ctx.fill();

  /* sign */
  ctx.fillStyle = '#8b5a28'; ctx.fillRect(hx+W/2-44, hy+80, 88, 22);
  ctx.fillStyle = '#f5e8c8'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
  ctx.fillText('SUA FAZENDA', hx+W/2, hy+95);

  /* window boxes */
  ctx.fillStyle = '#6aab30'; ctx.fillRect(hx+14, hy+138, 52, 10);
  ctx.fillStyle = '#6aab30'; ctx.fillRect(hx+W-66, hy+138, 52, 10);
};

World.prototype._drawWindow = function(ctx, wx, wy, ww, wh) {
  ctx.fillStyle = '#a8d8f0'; ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(wx+2, wy+2, ww/2-4, wh/2-4);
  ctx.strokeStyle = '#5a6870'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, ww, wh);
  ctx.beginPath(); ctx.moveTo(wx+ww/2, wy); ctx.lineTo(wx+ww/2, wy+wh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx, wy+wh/2); ctx.lineTo(wx+ww, wy+wh/2); ctx.stroke();
  ctx.fillStyle = '#a0712a'; ctx.fillRect(wx-3, wy-3, ww+6, 5);
  ctx.fillRect(wx-3, wy+wh-2, ww+6, 5);
};

/* ─── Shop ──────────────────────────────────────────────────────── */
World.prototype._drawShop = function(ctx, sx, sy) {
  var W = SHOP_CW * TILE_SIZE;  /* 192 */
  var H = SHOP_RH * TILE_SIZE;  /* 288 */
  if (sx + W < 0 || sx > CANVAS_WIDTH || sy + H < 0 || sy > VIEWPORT_H) { return; }

  /* foundation */
  ctx.fillStyle = '#b8a480'; ctx.fillRect(sx, sy+H-8, W, 10);

  /* walls */
  ctx.fillStyle = '#e8f0e0'; ctx.fillRect(sx, sy+68, W, H-68);
  ctx.fillStyle = '#d8e0d0'; ctx.fillRect(sx+W-14, sy+68, 14, H-68);

  /* roof – green-ish gable */
  ctx.fillStyle = '#3a7020';
  ctx.beginPath();
  ctx.moveTo(sx-12, sy+72); ctx.lineTo(sx+W/2, sy+4); ctx.lineTo(sx+W+12, sy+72);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a5010';
  ctx.beginPath();
  ctx.moveTo(sx-12, sy+72); ctx.lineTo(sx+W/2, sy+6);
  ctx.lineTo(sx+W/2, sy+14); ctx.lineTo(sx-8, sy+74); ctx.closePath(); ctx.fill();

  /* awning */
  ctx.fillStyle = '#d43020';
  ctx.fillRect(sx-8, sy+50, W+16, 22);
  for (var ai = 0; ai < 8; ai++) {
    ctx.fillStyle = ai%2===0 ? '#c02010' : '#e84030';
    ctx.fillRect(sx-8+ai*(W+16)/8, sy+50, (W+16)/8, 22);
  }
  /* awning scallop */
  ctx.fillStyle = '#d43020';
  for (var as = 0; as < 7; as++) {
    ctx.beginPath();
    ctx.arc(sx-8 + (as+0.5)*(W+16)/7, sy+72, (W+16)/14, 0, Math.PI);
    ctx.fill();
  }

  /* display window */
  ctx.fillStyle = '#a8d8f0'; ctx.fillRect(sx+10, sy+74, W-20, 55);
  ctx.strokeStyle = '#5a6870'; ctx.lineWidth = 2; ctx.strokeRect(sx+10, sy+74, W-20, 55);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(sx+12, sy+76, W/2-14, 20);
  /* items in window */
  var items = ['#86efac','#f87171','#fbbf24','#a5b4fc','#fb923c'];
  for (var wi = 0; wi < 5; wi++) {
    ctx.fillStyle = items[wi];
    ctx.fillRect(sx+18+wi*28, sy+86, 16, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(sx+18+wi*28+10, sy+86, 6, 30);
  }
  /* window label */
  ctx.fillStyle = '#1e3a10'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center';
  ctx.fillText('SEMENTES & INSUMOS', sx+W/2, sy+138);

  /* door */
  ctx.fillStyle = '#3a6018'; ctx.fillRect(sx+W/2-22, sy+H-80, 44, 80);
  ctx.fillStyle = '#2a4010'; ctx.fillRect(sx+W/2-22, sy+H-80, 44, 5);
  ctx.fillStyle = '#4a7828';
  ctx.beginPath(); ctx.arc(sx+W/2, sy+H-80, 22, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#a8d0f0';
  ctx.fillRect(sx+W/2-16, sy+H-72, 13, 22);
  ctx.fillRect(sx+W/2+3,  sy+H-72, 13, 22);
  ctx.fillStyle = '#f0c040';
  ctx.beginPath(); ctx.arc(sx+W/2+14, sy+H-54, 4, 0, Math.PI*2); ctx.fill();

  /* sign */
  ctx.fillStyle = '#4a6818'; ctx.fillRect(sx+W/2-52, sy+20, 104, 26);
  ctx.fillStyle = '#f5f0d0'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
  ctx.fillText('LOJA DO PIERRE', sx+W/2, sy+37);

  /* hanging sign */
  ctx.fillStyle = '#8b5a28';
  ctx.fillRect(sx+W/2-22, sy+42, 5, 12); ctx.fillRect(sx+W/2+17, sy+42, 5, 12);
  ctx.fillRect(sx+W/2-22, sy+52, 44, 18);
  ctx.fillStyle = '#f5f0d0'; ctx.font = 'bold 8px Arial';
  ctx.fillText('ABERTO', sx+W/2, sy+64);
};

/* ─── Collision ─────────────────────────────────────────────────── */
World.prototype.collides = function(wx, wy, pw, ph) {
  var corners = [
    { x: wx+3,    y: wy+ph*0.5  },
    { x: wx+pw-4, y: wy+ph*0.5  },
    { x: wx+3,    y: wy+ph-2    },
    { x: wx+pw-4, y: wy+ph-2    },
    { x: wx+pw/2, y: wy+ph-2    }
  ];
  for (var i = 0; i < corners.length; i++) {
    var col = Math.floor(corners[i].x / TILE_SIZE);
    var row = Math.floor(corners[i].y / TILE_SIZE);
    if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) { return true; }
    if (PASSABLE.indexOf(this.map[row][col]) === -1) { return true; }
  }
  return false;
};

World.prototype.getTile = function(col, row) {
  if (row < 0 || row >= WORLD_ROWS || col < 0 || col >= WORLD_COLS) { return -1; }
  return this.map[row][col];
};

World.prototype.setTile = function(col, row, type) {
  if (row >= 0 && row < WORLD_ROWS && col >= 0 && col < WORLD_COLS) {
    this.map[row][col] = type;
  }
};

World.prototype.isNearShop = function(player) {
  var px = player.tileCol(), py = player.tileRow();
  var dc = SHOP_C + Math.floor(SHOP_CW/2);
  var dr = SHOP_R + SHOP_RH;
  return Math.abs(px-dc) <= 2 && Math.abs(py-dr) <= 2;
};

World.prototype.isNearHouse = function(player) {
  var px = player.tileCol(), py = player.tileRow();
  var dc = HOUSE_C + Math.floor(HOUSE_CW/2);
  var dr = HOUSE_R + HOUSE_RH;
  return Math.abs(px-dc) <= 2 && Math.abs(py-dr) <= 2;
};
