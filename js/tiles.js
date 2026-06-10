/* Manages crop data on the world tile grid */
function CropManager() {
  this.grid = [];
  var r, c;
  for (r = 0; r < WORLD_ROWS; r++) {
    this.grid[r] = [];
    for (c = 0; c < WORLD_COLS; c++) {
      this.grid[r][c] = null;
    }
  }
  this.waterTimers = [];
  for (r = 0; r < WORLD_ROWS; r++) {
    this.waterTimers[r] = [];
    for (c = 0; c < WORLD_COLS; c++) {
      this.waterTimers[r][c] = 0;
    }
  }
}

CropManager.prototype.plant = function(col, row, cropType, worldMap) {
  var tile = worldMap[row] && worldMap[row][col];
  if (tile !== T_TILLED && tile !== T_WATERED) { return false; }
  if (this.grid[row][col]) { return false; }
  var data = CROP_DATA[cropType];
  if (!data) { return false; }
  this.grid[row][col] = {
    type:    cropType,
    stage:   CROP_SEED,
    timer:   0,
    fertile: true
  };
  return true;
};

CropManager.prototype.water = function(col, row, worldMap) {
  var tile = worldMap[row] && worldMap[row][col];
  if (tile !== T_TILLED && tile !== T_WATERED && !this.grid[row][col]) { return false; }
  if (tile === T_TILLED || tile === T_WATERED) {
    worldMap[row][col] = T_WATERED;
    this.waterTimers[row][col] = 36000;
    return true;
  }
  if (this.grid[row][col] && tile !== T_WATERED) {
    worldMap[row][col] = T_WATERED;
    this.waterTimers[row][col] = 36000;
    return true;
  }
  return false;
};

CropManager.prototype.harvest = function(col, row) {
  var crop = this.grid[row][col];
  if (!crop || crop.stage !== CROP_READY) { return null; }
  var type = crop.type;
  this.grid[row][col] = null;
  return type;
};

CropManager.prototype.update = function(dt, worldMap, weather) {
  var r, c;
  for (r = 0; r < WORLD_ROWS; r++) {
    for (c = 0; c < WORLD_COLS; c++) {
      var tile = worldMap[r][c];

      /* rain auto-waters farmland and tilled */
      if (weather === WEATHER_RAINY) {
        if (tile === T_TILLED) {
          worldMap[r][c] = T_WATERED;
          this.waterTimers[r][c] = 22000;
        }
        if (tile === T_WATERED) {
          this.waterTimers[r][c] = Math.max(this.waterTimers[r][c], 22000);
        }
      }

      /* water timer drain */
      if (tile === T_WATERED && this.waterTimers[r][c] > 0) {
        this.waterTimers[r][c] -= dt;
        if (this.waterTimers[r][c] <= 0) {
          worldMap[r][c] = T_TILLED;
          this.waterTimers[r][c] = 0;
        }
      }

      /* crop growth */
      var crop = this.grid[r][c];
      if (!crop || crop.stage === CROP_READY) { continue; }

      var data = CROP_DATA[crop.type];
      var isWet = (worldMap[r][c] === T_WATERED);
      var rate  = isWet ? 1.45 : 1.0;
      crop.timer += dt * rate;

      var stageEnd = data.stages[crop.stage];
      if (crop.timer >= stageEnd) {
        crop.timer -= stageEnd;
        crop.stage++;
        if (crop.stage >= CROP_READY) {
          crop.stage = CROP_READY;
          crop.timer = 0;
        }
      }
    }
  }
};

CropManager.prototype.draw = function(ctx, col, row, camX, camY, hovered) {
  var crop = this.grid[row] && this.grid[row][col];
  if (!crop) { return; }
  var sx = Math.round(col * TILE_SIZE - camX);
  var sy = Math.round(row * TILE_SIZE - camY);
  if (sx < -TILE_SIZE || sx > CANVAS_WIDTH + TILE_SIZE || sy < -TILE_SIZE || sy > VIEWPORT_H + TILE_SIZE) { return; }

  var ts = TILE_SIZE;
  var cx = sx + ts / 2;

  if (hovered && crop.stage === CROP_READY) {
    ctx.fillStyle = 'rgba(255,240,80,0.18)';
    ctx.fillRect(sx, sy, ts, ts);
  }

  if (crop.stage === CROP_SEED) {
    ctx.fillStyle = '#3a2010';
    ctx.beginPath(); ctx.arc(cx, sy + ts - 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a8a20';
    ctx.fillRect(cx - 1, sy + ts - 14, 2, 8);
  } else if (crop.stage === CROP_SPROUT) {
    this._drawSprout(ctx, sx, sy, crop.type);
  } else if (crop.stage === CROP_GROWING) {
    this._drawGrowing(ctx, sx, sy, crop.type);
  } else if (crop.stage === CROP_READY) {
    this._drawReady(ctx, sx, sy, crop.type, hovered);
  }

  /* growth bar */
  if (crop.stage !== CROP_READY) {
    var data = CROP_DATA[crop.type];
    var prog = Math.min(1, crop.timer / data.stages[crop.stage]);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(sx + 3, sy + ts - 6, ts - 6, 4);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(sx + 3, sy + ts - 6, Math.round((ts - 6) * prog), 4);
  }
};

CropManager.prototype._drawSprout = function(ctx, sx, sy, type) {
  var cx = sx + TILE_SIZE / 2;
  var base = sy + TILE_SIZE - 5;
  ctx.fillStyle = '#2a6010';
  ctx.fillRect(cx - 1, base - 14, 2, 14);
  var leafColor = CROP_DATA[type].color;
  ctx.fillStyle = leafColor;
  ctx.beginPath(); ctx.ellipse(cx - 6, base - 14, 7, 4, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 6, base - 18, 7, 4,  0.4, 0, Math.PI*2); ctx.fill();
};

CropManager.prototype._drawGrowing = function(ctx, sx, sy, type) {
  var cx = sx + TILE_SIZE / 2;
  var ts = TILE_SIZE;
  var base = sy + ts - 4;
  ctx.fillStyle = '#1a5008';
  ctx.fillRect(cx - 2, sy + 8, 4, ts - 12);

  var leafColor = CROP_DATA[type].color;
  var numLeaves = (type === CROP_PUMPKIN) ? 5 : 4;
  for (var i = 0; i < numLeaves; i++) {
    ctx.fillStyle = i % 2 === 0 ? leafColor : '#3a8018';
    ctx.beginPath();
    ctx.ellipse(
      cx + (i % 2 === 0 ? -12 : 12),
      sy + 10 + i * 7,
      11, 5,
      i % 2 === 0 ? 0.35 : -0.35,
      0, Math.PI * 2
    );
    ctx.fill();
  }

  if (type === CROP_PUMPKIN) {
    ctx.fillStyle = '#e06010';
    ctx.beginPath(); ctx.arc(cx, base - 6, 6, 0, Math.PI*2); ctx.fill();
  }
};

CropManager.prototype._drawReady = function(ctx, sx, sy, type, hovered) {
  var cx = sx + TILE_SIZE / 2;
  var ts = TILE_SIZE;

  /* glow */
  if (hovered) {
    ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 12;
  }
  ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2;
  ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#1a5008';
  ctx.fillRect(cx - 2, sy + 5, 4, ts - 10);

  if (type === CROP_SOY) {
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#86efac' : '#3a8018';
      ctx.beginPath();
      ctx.ellipse(cx + (i%2===0 ? -13 : 13), sy+8+i*7, 13, 6, i%2===0 ? 0.3 : -0.3, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#d9f99d';
    var pods = [[cx-16,sy+10],[cx+8,sy+22],[cx-14,sy+36],[cx+6,sy+48]];
    for (var p = 0; p < pods.length; p++) {
      ctx.fillRect(pods[p][0], pods[p][1], 9, 5);
    }
  } else if (type === CROP_STRAWBERRY) {
    for (var j = 0; j < 3; j++) {
      ctx.fillStyle = '#3a8018';
      ctx.beginPath(); ctx.ellipse(cx+(j%2===0?-11:11), sy+10+j*9, 11, 5, j%2===0?0.4:-0.4, 0, Math.PI*2); ctx.fill();
    }
    var berries = [[cx-12,sy+22],[cx+4,sy+20],[cx-10,sy+38],[cx+4,sy+36]];
    for (var b = 0; b < berries.length; b++) {
      var bx = berries[b][0], by = berries[b][1];
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(bx+4, by+8, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(bx+4, by+8, 4, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#16a34a'; ctx.fillRect(bx+2, by+1, 5, 5);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(bx+1, by+7, 2, 2); ctx.fillRect(bx+5, by+7, 2, 2);
    }
  } else if (type === CROP_PUMPKIN) {
    for (var k = 0; k < 3; k++) {
      ctx.fillStyle = '#3a8018';
      ctx.beginPath(); ctx.ellipse(cx+(k%2===0?-13:13), sy+8+k*7, 12, 5, k%2===0?0.35:-0.35, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.ellipse(cx, sy+40, 13, 11, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx-12, sy+40, 4, 10); ctx.fillRect(cx-5, sy+38, 4, 12);
    ctx.fillRect(cx+2, sy+38, 4, 12);  ctx.fillRect(cx+8, sy+40, 4, 10);
    ctx.fillStyle = '#15803d'; ctx.fillRect(cx-1, sy+29, 3, 8);
  }
};

CropManager.prototype.getHoveredTile = function(canvasX, canvasY, camX, camY) {
  var wx = canvasX + camX;
  var wy = canvasY + camY;
  var col = Math.floor(wx / TILE_SIZE);
  var row = Math.floor(wy / TILE_SIZE);
  if (col >= 0 && col < WORLD_COLS && row >= 0 && row < WORLD_ROWS) {
    return { col: col, row: row };
  }
  return null;
};
