function Player(wx, wy) {
  this.wx = wx;
  this.wy = wy;
  this.w  = PLAYER_W;
  this.h  = PLAYER_H;
  this.dir     = DIR_DOWN;
  this.moving  = false;
  this.walkFrame = 0;
  this.walkTimer = 0;
  this.WALK_INTERVAL = 170;
  this.energy     = INITIAL_ENERGY;
  this.activeTool = TOOL_HOE;
  this.toolAnim   = 0;
  this.toolTimer  = 0;
  this.TOOL_DUR   = 260;
}

Player.prototype.update = function(keys, dt, world) {
  var dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) { dx = -1; this.dir = DIR_LEFT;  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx =  1; this.dir = DIR_RIGHT; }
  if (keys['ArrowUp']    || keys['w'] || keys['W']) { dy = -1; this.dir = DIR_UP;    }
  if (keys['ArrowDown']  || keys['s'] || keys['S']) { dy =  1; this.dir = DIR_DOWN;  }
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  var spd = PLAYER_SPEED;
  var nx  = this.wx + dx * spd;
  var ny  = this.wy + dy * spd;

  if (dx !== 0 && !world.collides(nx, this.wy, this.w, this.h)) { this.wx = nx; }
  if (dy !== 0 && !world.collides(this.wx, ny, this.w, this.h)) { this.wy = ny; }

  this.wx = Math.max(0, Math.min(WORLD_COLS * TILE_SIZE - this.w, this.wx));
  this.wy = Math.max(0, Math.min(WORLD_ROWS * TILE_SIZE - this.h, this.wy));

  this.moving = (dx !== 0 || dy !== 0);

  if (this.moving) {
    this.walkTimer += dt;
    if (this.walkTimer > this.WALK_INTERVAL) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
    }
  } else {
    this.walkFrame = 0;
    this.walkTimer = 0;
  }

  if (this.toolTimer > 0) {
    this.toolTimer -= dt;
    this.toolAnim = 1 - (this.toolTimer / this.TOOL_DUR);
    if (this.toolTimer <= 0) { this.toolTimer = 0; this.toolAnim = 0; }
  }

  /* slow energy regen */
  if (!this.moving) {
    this.energy = Math.min(MAX_ENERGY, this.energy + 0.006 * dt / 16);
  }
};

Player.prototype.useTool = function() {
  var cost = TOOL_ENERGY[this.activeTool] || 0;
  if (this.energy < cost) { return false; }
  this.energy -= cost;
  this.toolTimer = this.TOOL_DUR;
  this.toolAnim  = 0;
  return true;
};

Player.prototype.facingTile = function() {
  var cx = Math.floor((this.wx + this.w / 2) / TILE_SIZE);
  var cy = Math.floor((this.wy + this.h * 0.75) / TILE_SIZE);
  if (this.dir === DIR_LEFT)  { return { col: cx - 1, row: cy }; }
  if (this.dir === DIR_RIGHT) { return { col: cx + 1, row: cy }; }
  if (this.dir === DIR_UP)    { return { col: cx, row: cy - 1 }; }
  return { col: cx, row: cy + 1 };
};

Player.prototype.tileCol = function() { return Math.floor((this.wx + this.w / 2) / TILE_SIZE); };
Player.prototype.tileRow = function() { return Math.floor((this.wy + this.h * 0.75) / TILE_SIZE); };

Player.prototype.draw = function(ctx, camX, camY) {
  var sx = Math.round(this.wx - camX);
  var sy = Math.round(this.wy - camY);
  if (sx < -60 || sx > CANVAS_WIDTH + 60 || sy < -80 || sy > VIEWPORT_H + 20) { return; }

  /* shadow */
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(sx + this.w / 2, sy + this.h, this.w * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  var leg = [0, 4, 0, -4][this.walkFrame];
  if (this.dir === DIR_DOWN)  { this._drawDown(ctx, sx, sy, leg); }
  else if (this.dir === DIR_UP)   { this._drawUp(ctx, sx, sy, leg); }
  else { this._drawSide(ctx, sx, sy, leg, this.dir === DIR_RIGHT); }

  if (this.toolTimer > 0) { this._drawSwing(ctx, sx, sy); }
};

/* ─── Sprite helpers ──────────────────────────────────────────── */
Player.prototype._hat = function(ctx, sx, sy) {
  ctx.fillStyle = '#7a4f00'; ctx.fillRect(sx+3, sy-7, 14, 7);
  ctx.fillStyle = '#9b6800'; ctx.fillRect(sx+1, sy-2, 18, 3);
  ctx.fillStyle = '#5a3800'; ctx.fillRect(sx+3, sy-7, 14, 3);
};

Player.prototype._head = function(ctx, sx, sy) {
  ctx.fillStyle = '#e8c090'; ctx.fillRect(sx+4, sy+1, 12, 11);
};

Player.prototype._eyes = function(ctx, sx, sy, dir) {
  ctx.fillStyle = '#3d2000';
  if (dir === DIR_DOWN)  { ctx.fillRect(sx+6, sy+6, 2, 2); ctx.fillRect(sx+12, sy+6, 2, 2); }
  if (dir === DIR_LEFT)  { ctx.fillRect(sx+5, sy+6, 2, 2); }
  if (dir === DIR_RIGHT) { ctx.fillRect(sx+13, sy+6, 2, 2); }
};

Player.prototype._shirt = function(ctx, sx, sy) {
  ctx.fillStyle = '#d94a18'; ctx.fillRect(sx+3, sy+12, 14, 9);
  ctx.fillStyle = '#b83a10'; ctx.fillRect(sx+5, sy+12, 10, 3);
};

Player.prototype._pants = function(ctx, sx, sy, legOff) {
  ctx.fillStyle = '#2a3fa0';
  ctx.fillRect(sx+3,  sy+20, 7, 7+legOff);
  ctx.fillRect(sx+10, sy+20, 7, 7-legOff);
};

Player.prototype._boots = function(ctx, sx, sy, legOff) {
  ctx.fillStyle = '#4a2c00';
  ctx.fillRect(sx+2,  sy+26+legOff, 8, 6);
  ctx.fillRect(sx+10, sy+26-legOff, 8, 6);
};

Player.prototype._drawDown = function(ctx, sx, sy, leg) {
  this._boots(ctx, sx, sy, leg);
  this._pants(ctx, sx, sy, leg);
  ctx.fillStyle = '#e8c090'; ctx.fillRect(sx,    sy+14, 4, 8); /* arms */
  ctx.fillStyle = '#e8c090'; ctx.fillRect(sx+16, sy+14, 4, 8);
  this._shirt(ctx, sx, sy);
  this._head(ctx, sx, sy);
  this._hat(ctx, sx, sy);
  this._eyes(ctx, sx, sy, DIR_DOWN);
};

Player.prototype._drawUp = function(ctx, sx, sy, leg) {
  this._boots(ctx, sx, sy, leg);
  this._pants(ctx, sx, sy, leg);
  ctx.fillStyle = '#c8a070'; ctx.fillRect(sx,    sy+14, 4, 8);
  ctx.fillStyle = '#c8a070'; ctx.fillRect(sx+16, sy+14, 4, 8);
  ctx.fillStyle = '#d94a18'; ctx.fillRect(sx+3, sy+12, 14, 9);
  ctx.fillStyle = '#c8a070'; ctx.fillRect(sx+4, sy+1, 12, 11); /* back of head */
  ctx.fillStyle = '#5a3800'; ctx.fillRect(sx+3, sy-5, 14, 8);
  ctx.fillStyle = '#7a4f00'; ctx.fillRect(sx+1, sy-2, 18, 3);
};

Player.prototype._drawSide = function(ctx, sx, sy, leg, right) {
  var flip = right ? 1 : -1;
  this._boots(ctx, sx, sy, leg);
  this._pants(ctx, sx, sy, leg);
  ctx.fillStyle = '#e8c090'; ctx.fillRect(sx + (right ? 16 : 0), sy+13, 4, 9);
  this._shirt(ctx, sx, sy);
  ctx.fillStyle = '#e8c090'; ctx.fillRect(sx+4, sy+1, 12, 11);
  this._hat(ctx, sx, sy);
  this._eyes(ctx, sx, sy, right ? DIR_RIGHT : DIR_LEFT);
};

Player.prototype._drawSwing = function(ctx, sx, sy) {
  var ang = (this.toolAnim * Math.PI * 0.9) - 0.5;
  var len = 20;
  var ox = 0, oy = 0;
  if (this.dir === DIR_LEFT)  { ox = -6; }
  else if (this.dir === DIR_RIGHT) { ox = 6; }
  else if (this.dir === DIR_UP)    { oy = -4; }
  else { oy = 6; }

  var tx = sx + 10 + ox + Math.cos(ang) * len;
  var ty = sy + 16 + oy + Math.sin(ang) * len;

  ctx.save();
  ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(sx+10+ox, sy+16+oy); ctx.lineTo(tx, ty); ctx.stroke();

  var t = this.activeTool;
  if (t === TOOL_HOE) {
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(tx-7, ty-2, 14, 4);
    ctx.fillStyle = '#c8c8c8'; ctx.fillRect(tx-6, ty-1, 12, 2);
  } else if (t === TOOL_WATER) {
    ctx.fillStyle = '#4a8bc8'; ctx.fillRect(tx-5, ty-4, 12, 8);
    ctx.fillStyle = '#3a6ab0'; ctx.beginPath(); ctx.arc(tx+9, ty, 4, 0, Math.PI*2); ctx.fill();
    if (this.toolAnim > 0.5) {
      ctx.fillStyle = 'rgba(100,180,255,0.7)';
      ctx.fillRect(tx-2, ty+5, 2, 4); ctx.fillRect(tx+2, ty+7, 2, 4); ctx.fillRect(tx+6, ty+5, 2, 4);
    }
  } else if (t === TOOL_SCYTHE) {
    ctx.strokeStyle = '#b0b0b0'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(tx, ty, 12, Math.PI*0.7, Math.PI*1.6); ctx.stroke();
  } else if (t === TOOL_SOY) {
    ctx.fillStyle = '#4a7a20'; ctx.fillRect(tx-4, ty-5, 8, 10);
    ctx.fillStyle = '#6aaa30'; ctx.fillRect(tx-3, ty-4, 6, 8);
  } else if (t === TOOL_BERRY) {
    ctx.fillStyle = '#a01818'; ctx.fillRect(tx-4, ty-5, 8, 10);
    ctx.fillStyle = '#d03030'; ctx.fillRect(tx-3, ty-4, 6, 8);
  } else if (t === TOOL_PUMPKIN) {
    ctx.fillStyle = '#a04000'; ctx.fillRect(tx-4, ty-5, 8, 10);
    ctx.fillStyle = '#d06000'; ctx.fillRect(tx-3, ty-4, 6, 8);
  }
  ctx.restore();
};
