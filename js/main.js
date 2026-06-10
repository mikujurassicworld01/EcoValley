var game = null;

function iniciarJogo() {
  document.getElementById('tela-inicial').classList.add('hidden');
  document.getElementById('jogo').classList.remove('hidden');
  if (!game) { game = new Game(); }
  game.start();
}

function mostrarInstrucoes() {
  document.getElementById('instrucoes').classList.remove('hidden');
}

function fecharInstrucoes() {
  document.getElementById('instrucoes').classList.add('hidden');
}

window.addEventListener('load', function() {
  document.getElementById('btn-jogar').addEventListener('click', iniciarJogo);
  document.getElementById('btn-instrucoes').addEventListener('click', mostrarInstrucoes);
  document.getElementById('btn-fechar-instrucoes').addEventListener('click', fecharInstrucoes);
});
