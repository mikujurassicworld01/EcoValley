function UI(game) {
  this.game     = game;
  this.messages = [];
}

UI.prototype.showMessage = function(text, duration) {
  this.messages.push({ text: text, timer: duration || 2800, alpha: 1 });
  if (this.messages.length > 6) { this.messages.shift(); }
};

UI.prototype.update = function(dt) {
  for (var i = this.messages.length - 1; i >= 0; i--) {
    this.messages[i].timer -= dt;
    if (this.messages[i].timer < 700) {
      this.messages[i].alpha = Math.max(0, this.messages[i].timer / 700);
    }
    if (this.messages[i].timer <= 0) { this.messages.splice(i, 1); }
  }
};

/* ─── Main draw entry ────────────────────────────────────────────── */
UI.prototype.draw = function(ctx) {
  this._drawHUD(ctx);
  this._drawMessages(ctx);
  this._drawProximityHint(ctx);
};

/* ─── HUD: dark bottom bar ───────────────────────────────────────── */
UI.prototype._drawHUD = function(ctx) {
  var g  = this.game;
  var hy = HUD_Y;
  var ts = 40;  /* tool slot size */

  /* background */
  ctx.fillStyle = '#1a0e04';
  ctx.fillRect(0, hy, CANVAS_WIDTH, HUD_H);
  ctx.fillStyle = '#4a3010';
  ctx.fillRect(0, hy, CANVAS_WIDTH, 3);
  ctx.fillStyle = '#2e1a06';
  ctx.fillRect(0, hy+3, CANVAS_WIDTH, 2);

  /* ── top row: stats ── */
  var statsY = hy + 26;

  /* energy bar */
  var epct = Math.max(0, Math.min(1, g.player.energy / MAX_ENERGY));
  var EBAR_W = 130, EBAR_X = 14;
  ctx.fillStyle = '#0e0604';
  _rrect(ctx, EBAR_X, hy + 8, EBAR_W, 16, 4);
  ctx.fill();
  var eColor = epct > 0.5 ? '#fbbf24' : epct > 0.25 ? '#f97316' : '#ef4444';
  ctx.fillStyle = eColor;
  _rrect(ctx, EBAR_X+2, hy+10, Math.round((EBAR_W-4)*epct), 12, 3);
  ctx.fill();
  ctx.fillStyle = '#f5dca8';
  ctx.font = 'bold 9px Arial'; ctx.textAlign = 'left';
  ctx.fillText('⚡ ENERGIA', EBAR_X + 4, hy + 21);

  /* ecology bar */
  var eco = Math.max(0, Math.min(100, Math.round(g.ecology)));
  var ECOW = 110, ECOX = EBAR_X + EBAR_W + 12;
  ctx.fillStyle = '#0e0604';
  _rrect(ctx, ECOX, hy+8, ECOW, 16, 4); ctx.fill();
  var ecColor = eco > 60 ? '#4ade80' : eco > 30 ? '#facc15' : '#ef4444';
  ctx.fillStyle = ecColor;
  _rrect(ctx, ECOX+2, hy+10, Math.round((ECOW-4)*eco/100), 12, 3); ctx.fill();
  ctx.fillStyle = '#a8e8b0';
  ctx.font = 'bold 9px Arial'; ctx.textAlign = 'left';
  ctx.fillText('🌿 ECOLOGIA ' + eco + '%', ECOX+4, hy+21);

  /* date */
  ctx.fillStyle = '#f5dca8';
  ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
  ctx.fillText(g.weather.getDateText(), CANVAS_WIDTH/2, statsY);

  /* weather */
  ctx.font = '12px Arial';
  ctx.fillText(g.weather.getIcon() + ' ' + g.weather.getLabel(), CANVAS_WIDTH/2, hy+36);

  /* money */
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px Arial'; ctx.textAlign = 'right';
  ctx.fillText('💰 R$' + Math.floor(g.money), CANVAS_WIDTH - 14, statsY);

  /* inventory */
  var invParts = [];
  if (g.inv.soja    > 0) { invParts.push('🌱×' + g.inv.soja);    }
  if (g.inv.morango > 0) { invParts.push('🍓×' + g.inv.morango); }
  if (g.inv.abobora > 0) { invParts.push('🎃×' + g.inv.abobora); }
  if (invParts.length > 0) {
    ctx.fillStyle = '#d0e8c0'; ctx.font = '11px Arial'; ctx.textAlign = 'right';
    ctx.fillText(invParts.join('  '), CANVAS_WIDTH-14, hy+36);
  }

  /* ── bottom row: tool slots ── */
  var totalSlotW = TOOL_SLOTS * (ts + 4) - 4;
  var startX     = Math.floor((CANVAS_WIDTH - totalSlotW) / 2);
  var slotY      = hy + 38;

  for (var i = 0; i < TOOL_SLOTS; i++) {
    var slotX  = startX + i * (ts + 4);
    var active = (i === g.player.activeTool);

    /* slot background */
    ctx.fillStyle = active ? '#4a3408' : '#2e1e04';
    _rrect(ctx, slotX, slotY, ts, ts, 5); ctx.fill();
    ctx.strokeStyle = active ? '#fbbf24' : '#7a5a20';
    ctx.lineWidth   = active ? 2.5 : 1.5;
    _rrect(ctx, slotX, slotY, ts, ts, 5); ctx.stroke();

    /* inner bevel */
    if (!active) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      _rrect(ctx, slotX+2, slotY+2, ts-4, ts/2, 4); ctx.fill();
    }

    /* tool icon */
    this._drawToolIcon(ctx, i, slotX + ts/2, slotY + ts/2);

    /* slot number */
    ctx.fillStyle = active ? '#fbbf24' : '#6a4a18';
    ctx.font = '8px Arial'; ctx.textAlign = 'left';
    ctx.fillText(i+1, slotX+3, slotY+11);
  }
};

UI.prototype._drawToolIcon = function(ctx, tool, cx, cy) {
  ctx.save();
  switch (tool) {
    case TOOL_HOE: /* pickaxe / hoe */
      ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx-8, cy+8); ctx.lineTo(cx+8, cy-8); ctx.stroke();
      ctx.fillStyle = '#9a8870'; ctx.fillRect(cx+2, cy-12, 10, 6);
      ctx.fillStyle = '#c8c0b0'; ctx.fillRect(cx+3, cy-11, 8, 4);
      break;
    case TOOL_WATER: /* watering can */
      ctx.fillStyle = '#4a8bc8'; ctx.fillRect(cx-9, cy-5, 14, 10);
      ctx.fillStyle = '#3a6ab0'; ctx.beginPath(); ctx.arc(cx+8, cy+2, 5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#4a8bc8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx-9, cy-5); ctx.lineTo(cx-9, cy-9); ctx.lineTo(cx+2, cy-9); ctx.stroke();
      ctx.fillStyle = '#80c4f8'; ctx.fillRect(cx-2, cy+8, 2, 4); ctx.fillRect(cx+2, cy+9, 2, 4); ctx.fillRect(cx+6, cy+8, 2, 4);
      break;
    case TOOL_SOY: /* seed packet green */
      ctx.fillStyle = '#3a7a18'; ctx.fillRect(cx-7, cy-8, 14, 16);
      ctx.fillStyle = '#6aaa30'; ctx.fillRect(cx-5, cy-6, 10, 12);
      ctx.fillStyle = '#f5f0d0'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
      ctx.fillText('SOJ', cx, cy+3);
      break;
    case TOOL_BERRY: /* seed packet red */
      ctx.fillStyle = '#8a1818'; ctx.fillRect(cx-7, cy-8, 14, 16);
      ctx.fillStyle = '#d03030'; ctx.fillRect(cx-5, cy-6, 10, 12);
      ctx.fillStyle = '#f5f0d0'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
      ctx.fillText('MOR', cx, cy+3);
      break;
    case TOOL_PUMPKIN: /* seed packet orange */
      ctx.fillStyle = '#7a3008'; ctx.fillRect(cx-7, cy-8, 14, 16);
      ctx.fillStyle = '#c05010'; ctx.fillRect(cx-5, cy-6, 10, 12);
      ctx.fillStyle = '#f5f0d0'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
      ctx.fillText('ABÓ', cx, cy+3);
      break;
    case TOOL_SCYTHE: /* scythe */
      ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx+2, cy+4, 12, Math.PI*0.7, Math.PI*1.5); ctx.stroke();
      ctx.strokeStyle = '#8b6914'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx+4, cy-10); ctx.lineTo(cx-4, cy+10); ctx.stroke();
      break;
    default: /* empty */
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(cx-8, cy-8, 16, 16);
      break;
  }
  ctx.restore();
};

/* ─── Floating messages ─────────────────────────────────────────── */
UI.prototype._drawMessages = function(ctx) {
  ctx.save();
  ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
  for (var i = 0; i < this.messages.length; i++) {
    var msg = this.messages[i];
    var oy  = (this.messages.length - 1 - i) * 30;
    var by  = Math.round(VIEWPORT_H / 2 - 60 - oy);
    var tw  = ctx.measureText(msg.text).width + 28;
    ctx.globalAlpha = msg.alpha * 0.9;
    ctx.fillStyle = 'rgba(20,10,2,0.88)';
    _rrect(ctx, Math.round(CANVAS_WIDTH/2 - tw/2), by-18, tw, 24, 6); ctx.fill();
    ctx.globalAlpha = msg.alpha;
    ctx.fillStyle = '#fde68a';
    ctx.fillText(msg.text, CANVAS_WIDTH/2, by);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
};

/* ─── Proximity hint ────────────────────────────────────────────── */
UI.prototype._drawProximityHint = function(ctx) {
  var g = this.game;
  var text = null, color = null;
  if (g.world.isNearShop(g.player))  { text = '[E] Entrar na Loja do Pierre';  color = '#4ade80'; }
  if (g.world.isNearHouse(g.player)) { text = '[E] Dormir e avançar o dia (+energia)'; color = '#fbbf24'; }
  if (!text) { return; }

  ctx.save();
  ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
  var tw = ctx.measureText(text).width + 32;
  var hx = Math.round(CANVAS_WIDTH/2 - tw/2);
  var hy2 = HUD_Y - 38;
  ctx.fillStyle = 'rgba(10,6,2,0.88)';
  _rrect(ctx, hx, hy2, tw, 26, 7); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  _rrect(ctx, hx, hy2, tw, 26, 7); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText(text, CANVAS_WIDTH/2, hy2 + 17);
  ctx.restore();
};

/* ─── Tile action hint (shown above tile) ───────────────────────── */
UI.prototype.drawTileHint = function(ctx, col, row, camX, camY, tool) {
  var sx = Math.round(col * TILE_SIZE - camX);
  var sy = Math.round(row * TILE_SIZE - camY);
  if (sy < 0 || sy > VIEWPORT_H) { return; }

  /* highlight overlay */
  ctx.fillStyle = 'rgba(255,240,80,0.14)';
  ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2;
  ctx.strokeRect(sx+1, sy+1, TILE_SIZE-2, TILE_SIZE-2);

  /* hint label */
  var hints = ['Lavrar','Regar','Plantar Soja','Plantar Morango','Plantar Abóbora','Colher'];
  var hint  = hints[tool] || '';
  if (!hint) { return; }
  ctx.save();
  ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
  var tw = ctx.measureText(hint).width + 12;
  ctx.fillStyle = 'rgba(20,10,2,0.82)';
  _rrect(ctx, sx + TILE_SIZE/2 - tw/2, sy - 18, tw, 15, 4); ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.fillText(hint, sx + TILE_SIZE/2, sy - 7);
  ctx.restore();
};

/* ─── Helpers ───────────────────────────────────────────────────── */
function _rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}
