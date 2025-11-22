/* script.js */
const canvas = document.getElementById('ruleta');
const ctx = canvas.getContext('2d');
const btnGirar = document.getElementById('btnGirar');
const resultadoEl = document.getElementById('resultado');
const cantidadInput = document.getElementById('cantidad');
const listaPremios = document.getElementById('listaPremios');
const btnAplicar = document.getElementById('btnAplicar');
const btnReset = document.getElementById('btnReset');
const explosionScreen = document.getElementById('explosion');
const explosionSound = document.getElementById('explosionSound');
const minaSound = document.getElementById('minaSound');
const techiesSound = document.getElementById('techiesSound');

let opciones = [
  "Premio 1",
  "Premio 2",
  "¡MINA EXPLOSIVA!",
  "Premio 3",
  "Premio 4"
];

let colores = ["#2e8b57","#6a0dad","#ff0000","#1e90ff","#daa520"];

// ensure default mine at option 3 (index 2)
function ensureMinaAtThird(){
  if (opciones.length >= 3) {
    opciones[2] = "¡MINA EXPLOSIVA!";
    colores[2] = "#ff0000";
  }
}
ensureMinaAtThird();

let total = opciones.length;
let anguloActual = 0;
let velocidad = 0;
let girando = false;

function generarListaInputs(){
  listaPremios.innerHTML = '';
  for (let i = 0; i < total; i++){
    const div = document.createElement('div');
    div.className = 'premio-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = opciones[i] || ('Premio ' + (i+1));
    input.dataset.index = i;

    const color = document.createElement('input');
    color.type = 'color';
    color.value = colores[i] || '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
    color.className = 'color-box';
    color.dataset.index = i;

    const label = document.createElement('div');
    label.style.minWidth = '28px';
    label.style.fontSize = '12px';
    label.style.opacity = '0.85';
    label.innerText = (i+1);

    // update arrays on change
    input.addEventListener('input', (e)=>{
      const idx = Number(e.target.dataset.index);
      opciones[idx] = e.target.value;
    });
    color.addEventListener('input', (e)=>{
      const idx = Number(e.target.dataset.index);
      colores[idx] = e.target.value;
      dibujarRuleta();
    });

    div.appendChild(label);
    div.appendChild(input);
    div.appendChild(color);
    listaPremios.appendChild(div);
  }
}

function aplicarCambios(){
  // read count
  let cnt = parseInt(cantidadInput.value) || 5;
  cnt = Math.max(2, Math.min(12, cnt));
  // adjust opciones and colores arrays
  if (cnt > opciones.length){
    for (let i = opciones.length; i < cnt; i++){
      opciones.push('Premio ' + (i+1));
      colores.push('#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'));
    }
  } else if (cnt < opciones.length){
    opciones = opciones.slice(0,cnt);
    colores = colores.slice(0,cnt);
  }
  total = opciones.length;
  // enforce mina at third position if exists
  ensureMinaAtThird();
  generarListaInputs();
  dibujarRuleta();
}

function restablecer(){
  opciones = ["Premio 1","Premio 2","¡MINA EXPLOSIVA!","Premio 3","Premio 4"];
  colores = ["#2e8b57","#6a0dad","#ff0000","#1e90ff","#daa520"];
  total = opciones.length;
  cantidadInput.value = total;
  generarListaInputs();
  dibujarRuleta();
}

cantidadInput.addEventListener('change', aplicarCambios);
btnAplicar.addEventListener('click', aplicarCambios);
btnReset.addEventListener('click', restablecer);

// DRAWING
function dibujarRuleta(){
  const w = canvas.width;
  const h = canvas.height;
  const cx = w/2, cy = h/2;
  const radius = Math.min(w,h)/2 - 6;
  ctx.clearRect(0,0,w,h);

  const ang = (2*Math.PI) / total;
  for (let i = 0; i < total; i++){
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.fillStyle = colores[i] || '#444';
    ctx.arc(cx,cy,radius, ang*i + anguloActual, ang*(i+1) + anguloActual );
    ctx.closePath();
    ctx.fill();

    // text
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(ang*i + ang/2 + anguloActual);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    // adjust font size to fit
    ctx.font = '18px Roboto';
    // wrap long text: simple truncation
    let text = opciones[i] || '';
    if (text.length > 26) text = text.slice(0,23) + '...';
    ctx.fillText(text, radius - 18, 8);
    // mini animación MINA
    if ((opciones[i] || '').toLowerCase().includes('mina')) {
        ctx.beginPath();
        let pulse = Math.abs(Math.sin(Date.now()/200)) * 10 + 8;
        ctx.arc(0, 0, pulse, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,50,50,0.6)';
        ctx.fill();
    }

    ctx.restore();
  }

  // center circle
  ctx.beginPath();
  ctx.arc(cx,cy,48,0,Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(212,175,55,0.9)';
  ctx.stroke();

  // small pointer highlight
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx - 12, cy - radius + 18);
  ctx.lineTo(cx + 12, cy - radius + 18);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
}

function animar(){
  if (!girando) return;
  anguloActual += velocidad;
  // damping
  velocidad *= 0.986;
  if (Math.abs(velocidad) < 0.0015){
    girando = false;
    velocidad = 0;
    determinarResultado();
    return;
  }
  dibujarRuleta();
  requestAnimationFrame(animar);
}

btnGirar.addEventListener('click', ()=>{
  if (girando) return;
  // random initial velocity (direction random)
  velocidad = (Math.random()*0.35 + 0.25) * (Math.random()<0.5?1:-1);
  girando = true;
  resultadoEl.innerText = '';
  animar();
});

// determine result based on top pointer (angle  -PI/2)
function determinarResultado(){
  // normalize angle so that 0 at 0 rad; pointer at -PI/2
  const angPor = (2*Math.PI)/total;
  // compute the angle that points to top
  // current rotation anguloActual moves the wheel; sector index at pointer:
  // angle at pointer equals (-PI/2 - anguloActual) modulo 2PI
  let angAtPointer = (-Math.PI/2 - anguloActual) % (2*Math.PI);
  if (angAtPointer < 0) angAtPointer += 2*Math.PI;
  let idx = Math.floor(angAtPointer / angPor);
  // ensure within bounds
  idx = (idx + total) % total;
  const premio = opciones[idx] || '';
  resultadoEl.innerText = 'Resultado: ' + premio;

  // sonido especial si contiene "techies"
  if (premio.toLowerCase().includes('techies')) {
    try{
      techiesSound.currentTime = 0;
      techiesSound.play();
    }catch(e){}
  }

  // efecto de explosión si contiene "mina"
  
  if (premio.toLowerCase().includes('mina')) {
    try {
      minaSound.currentTime = 0;
      minaSound.play();
    } catch(e){}
    activarExplosion();
  }

}

function activarExplosion(){
  try{
    explosionSound.currentTime = 0;
    explosionSound.play();
  }catch(e){}
  explosionScreen.style.display = 'flex';
  setTimeout(()=>{ explosionScreen.style.display = 'none'; }, 2500);
}

// initialization
function init(){
  total = opciones.length;
  cantidadInput.value = total;
  generarListaInputs();
  dibujarRuleta();
}

init();
