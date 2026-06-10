function Shop(game) {
  this.game = game;
  this.open = false;
}

Shop.prototype.show = function() {
  this.open = true;
  this._refresh();
  document.getElementById('loja').classList.remove('hidden');
};

Shop.prototype.hide = function() {
  this.open = false;
  document.getElementById('loja').classList.add('hidden');
};

Shop.prototype._refresh = function() {
  var g = this.game;
  document.getElementById('loja-dinheiro').textContent = 'R$' + Math.floor(g.money);

  /* sell list */
  var sellList = document.getElementById('loja-vender-lista');
  sellList.innerHTML = '';

  var inv = [
    { key: 'soja',    label: '🌱 Soja',    count: g.inv.soja    },
    { key: 'morango', label: '🍓 Morango',  count: g.inv.morango },
    { key: 'abobora', label: '🎃 Abóbora', count: g.inv.abobora }
  ];

  var hasSell = false;
  for (var i = 0; i < inv.length; i++) {
    var it = inv[i];
    if (it.count <= 0) { continue; }
    hasSell = true;
    var price = CROP_DATA[it.key].sell;
    var total = it.count * price;
    var div = document.createElement('div');
    div.className = 'loja-item';
    div.innerHTML =
      '<div class="loja-item-info">' +
        '<span class="loja-item-nome">' + it.label + '</span>' +
        '<span class="loja-item-desc">' + it.count + ' un. &times; R$' + price + '</span>' +
      '</div>' +
      '<div class="loja-item-preco">R$' + total + '</div>';
    var btn = document.createElement('button');
    btn.textContent = 'Vender Tudo';
    btn.type = 'button';
    btn.className = 'btn-vender';
    (function(key, amount) {
      btn.addEventListener('click', function() {
        g.money += amount;
        g.inv[key] = 0;
        g.shop._refresh();
        g.ui.showMessage('+R$' + amount + '! ' + (key === 'soja' ? 'Soja vendida.' : key === 'morango' ? 'Morangos vendidos.' : 'Abóboras vendidas.'));
      });
    })(it.key, total);
    div.appendChild(btn);
    sellList.appendChild(div);
  }

  if (!hasSell) {
    var p = document.createElement('p');
    p.className = 'vazio-texto';
    p.textContent = 'Inventário vazio — colha suas plantações!';
    sellList.appendChild(p);
  }

  /* buy buttons */
  var btnAdubo = document.getElementById('btn-comprar-adubo');
  var btnSolo  = document.getElementById('btn-reparar-solo');
  var btnSeeds = document.getElementById('btn-sementes');
  btnAdubo.disabled = g.money < FERTILIZER_COST;
  btnSolo.disabled  = g.money < SOIL_REPAIR_COST;
  if (btnSeeds) { btnSeeds.disabled = g.money < 30; }
};
