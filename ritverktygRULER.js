const objects = [];
let dragTarget = null;
let offsetX = 0;
let offsetY = 0;
let selected = null;
let nextTableNumber = 1;
let showAxes = false;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const wrapper       = document.getElementById("canvasWrapper");
//const rulerX        = document.getElementById("rulerX");
//const rulerY        = document.getElementById("rulerY");

const pxPerMeter  = 50;   // 50px = 1 m so a 2.4 m table (120px) stays the same
const meterCount  = 50;   // 50 m × 50px = 2500px
//const rulerSize   = 40;   // in px, same as in CSS

const dpr = window.devicePixelRatio || 1;

function initCanvases() {
  const totalPx = meterCount * pxPerMeter * dpr;

  [canvas, rulerX, rulerY].forEach(c => {
    c.width  = totalPx + (c === canvas ? 0 : 0); // rulers draw to wrapper width/height below
    c.height = totalPx + (c === canvas ? 0 : 0);
  });

  // canvas CSS size:
  canvas.style.width  = meterCount * pxPerMeter + "px";
  canvas.style.height = meterCount * pxPerMeter + "px";

  // rulerX CSS size: full wrapper width
  rulerX.width  = (wrapper.clientWidth) * dpr;
  rulerX.height = rulerSize * dpr;
  rulerX.style.height = rulerSize + "px";

  // rulerY CSS size: full wrapper height
  rulerY.width  = rulerSize * dpr;
  rulerY.height = (wrapper.clientHeight) * dpr;
  rulerY.style.width = rulerSize + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawRulers() {
  const sx = wrapper.scrollLeft;
  const sy = wrapper.scrollTop;
  const w  = wrapper.clientWidth;
  const h  = wrapper.clientHeight;
  const cX = rulerX.getContext("2d");
  const cY = rulerY.getContext("2d");

  cX.clearRect(0, 0, rulerX.width, rulerX.height);
  cY.clearRect(0, 0, rulerY.width, rulerY.height);

  cX.scale(dpr, dpr);
  cY.scale(dpr, dpr);

  // X-axis ticks
  cX.strokeStyle = "#000";
  cX.fillStyle   = "#000";
  cX.lineWidth   = 1;
  cX.font        = "10px sans-serif";
  cX.textAlign   = "center";
  cX.textBaseline= "bottom";

  const startX = Math.floor(sx / pxPerMeter);
  const endX   = Math.min(meterCount, Math.ceil((sx + w) / pxPerMeter));

  for (let m = startX; m <= endX; m++) {
    const x = m * pxPerMeter - sx;
    if (x < 0 || x > w) continue;
    cX.beginPath();
    cX.moveTo(x, rulerSize);
    cX.lineTo(x, rulerSize - 10);
    cX.stroke();
    cX.fillText(m.toString(), x, rulerSize - 12);
  }

  // Y-axis ticks
  cY.strokeStyle = "#000";
  cY.fillStyle   = "#000";
  cY.lineWidth   = 1;
  cY.font        = "10px sans-serif";
  cY.textAlign   = "right";
  cY.textBaseline= "middle";

  const startY = Math.floor(sy / pxPerMeter);
  const endY   = Math.min(meterCount, Math.ceil((sy + h) / pxPerMeter));

  for (let m = startY; m <= endY; m++) {
    const y = m * pxPerMeter - sy;
    if (y < 0 || y > h) continue;
    cY.beginPath();
    cY.moveTo(rulerSize, y);
    cY.lineTo(rulerSize - 10, y);
    cY.stroke();
    cY.fillText(m.toString(), rulerSize - 12, y);
  }

  // reset transforms
  cX.setTransform(1,0,0,1,0,0);
  cY.setTransform(1,0,0,1,0,0);
}

// —————————————————————————————————————————————
// your existing resizeCanvas → replaced by initCanvases + initial scroll
initCanvases();
// start at top-left
wrapper.scrollLeft = 0;
wrapper.scrollTop  = 0;

// redraw when wrapper scrolls or window resizes
wrapper.addEventListener("scroll", () => {
  drawRulers();
  drawAll();   // if you want axes to shift too
});
window.addEventListener("resize", () => {
  initCanvases();
  drawRulers();
  drawAll();
});

// draw the scene once
drawRulers();
drawAll();

/*
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && measuring) {
      measuring = false;
      measureStart = null;
      alert("Mätning avbruten.");
    }
  });
  */

function drawAll(isForExport = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#111";
  ctx.font = "bold 32px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 1;

  const titleText = document.getElementById("titleInput").value;
  /*
  const centerX = isForExport
    ? canvas.width / 2
    : wrapper.scrollLeft + wrapper.clientWidth  / 2;

  ctx.fillText(titleText, centerX, 50);
  */
  const screenX = isForExport
    ? canvas.width / 2
    : wrapper.scrollLeft + wrapper.clientWidth  / 2;
  const screenY = isForExport
    ? 50
    : wrapper.scrollTop  + 50;
  
  ctx.fillText(titleText, screenX, screenY);
  ctx.shadowColor = "transparent";

  for (const obj of objects) {
    // ← **only this block changed**:
    ctx.lineWidth   = obj === selected ? 3 : 1;
    ctx.strokeStyle = obj === selected ? "#007BFF" : "#000";

    if (obj.type === "rect") {
      ctx.save();
      ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
      ctx.rotate((obj.rotation || 0) * Math.PI / 180);
      ctx.fillStyle = obj.color || "#ead8b6";
      ctx.fillRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
      ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Bord ${obj.tableNumber}`, 0, -6);
      ctx.fillText(`${obj.seats} platser`, 0, 12);
      ctx.restore();

    } else if (obj.type === "circle") {
      ctx.beginPath();
      ctx.fillStyle = obj.color || "#ead8b6";
      ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Bord ${obj.tableNumber}`, obj.x, obj.y - 6);
      ctx.fillText(`${obj.seats} platser`, obj.x, obj.y + 12);

    } else if (obj.type === "guest") {
      ctx.beginPath();
      ctx.fillStyle = "#fffffe";
      ctx.arc(obj.x, obj.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4b98c";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(obj.name, obj.x, obj.y + 1);
    }
  }

  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#333";
  ctx.font = "bold 48px 'Segoe UI', sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  const x = canvas.width * 0.49;
  const y = canvas.height * 0.50;
  ctx.fillText("EverAfterbyEster", x, y);

  if (showAxes) {
    const meterToPx = 80;
    const viewCenterX = wrapper.scrollLeft + wrapper.clientWidth  / 2;
    const viewCenterY = wrapper.scrollTop  + wrapper.clientHeight / 2;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);

    ctx.beginPath();
    ctx.moveTo(0, viewCenterY);
    ctx.lineTo(canvas.width, viewCenterY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(viewCenterX, 0);
    ctx.lineTo(viewCenterX, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let x = -10; x <= 20; x++) {
      const px = viewCenterX + x * meterToPx;
      if (px < 0 || px > canvas.width) continue;
      ctx.beginPath();
      ctx.moveTo(px, viewCenterY - 5);
      ctx.lineTo(px, viewCenterY + 5);
      ctx.stroke();
      if (x !== 0) ctx.fillText(`${x} m`, px, viewCenterY + 8);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let y = -10; y <= 10; y++) {
      const py = viewCenterY + y * meterToPx;
      if (py < 0 || py > canvas.height) continue;
      ctx.beginPath();
      ctx.moveTo(viewCenterX - 5, py);
      ctx.lineTo(viewCenterX + 5, py);
      ctx.stroke();
      if (y !== 0) ctx.fillText(`${-y} m`, viewCenterX + 8, py);
    }

    ctx.restore();
  }

  ctx.restore();
}

function addSelectedTable() {
  const type = document.getElementById("tableType").value;
  const standardHeight = 75;
  let obj = null;

  switch (type) {
    case "round-6":
      obj = { type: "circle", x: 150, y: 150, r: 60, seats: 6 };
      break;
    case "round-8":
      obj = { type: "circle", x: 150, y: 150, r: 70, seats: 8 };
      break;
    case "rect-4":
      obj = { type: "rect", x: 150, y: 150, w: 100, h: standardHeight, seats: 4, rotation: 0 };
      break;
    case "rect-6":
      obj = { type: "rect", x: 150, y: 150, w: 144, h: standardHeight, seats: 6, rotation: 0 };
      break;
    case "rect-8":
      obj = { type: "rect", x: 150, y: 150, w: 192, h: standardHeight, seats: 8, rotation: 0 };
      break;
  }

  if (obj) {
    obj.tableNumber = nextTableNumber++;
    objects.push(obj);
    drawAll();
  }
}

function addGuest() {
  const name = prompt("Namn på gäst?");
  if (name) {
    objects.push({ type: "guest", x: 300, y: 300, name });
    drawAll();
  }
}

function removeSelected() {
  if (selected) {
    const index = objects.indexOf(selected);
    if (index > -1) objects.splice(index, 1);
    selected = null;
    drawAll();
  }
}

function rotateSelected() {
  if (selected && selected.type === "rect") {
    selected.rotation = ((selected.rotation || 0) + 90) % 360;
    drawAll();
  }
}

function renameTable() {
  if (selected && (selected.type === "rect" || selected.type === "circle")) {
    const input = prompt("Ange nytt bordsnummer:", selected.tableNumber || "");
    if (input) {
      selected.tableNumber = input;
      drawAll();
    }
  }
}

function saveAsImage() {
  const link = document.createElement('a');
  link.download = 'bordsplacering.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function createGuestList() {
  const guests = objects.filter(o => o.type === "guest");
  if (guests.length === 0) {
    alert("Inga gäster tillagda ännu.");
    return;
  }

  const ul = document.getElementById('guestList');
  ul.innerHTML = '';  // töm tidigare lista

  guests.forEach((g, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${g.name}`;
    ul.appendChild(li);
  });

  // Visa modal + overlay
  document.getElementById('guestModalOverlay').style.display = 'block';
  document.getElementById('guestListContainer').style.display = 'block';
}

// --- Lägg till denna funktion under createGuestList() ---
function closeGuestList() {
  document.getElementById('guestModalOverlay').style.display = 'none';
  document.getElementById('guestListContainer').style.display = 'none';
}

function toggleAxes() {
    showAxes = !showAxes;
    drawAll();
  }

// ——— enable PointerEvents dragging on mobile & desktop ———
// prevent default touch gestures (scroll/pinch) on the canvas
canvas.style.touchAction = 'none';

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  selected = null;
  
  // loop objects from topmost to bottom
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    let hit = false;
    
    if (obj.type === 'rect') {
      const angle = ((obj.rotation||0) * Math.PI) / 180;
      const cx = obj.x + obj.w/2, cy = obj.y + obj.h/2;
      const dx = mx - cx, dy = my - cy;
      const rx = dx*Math.cos(-angle) - dy*Math.sin(-angle);
      const ry = dx*Math.sin(-angle) + dy*Math.cos(-angle);
      if (rx >= -obj.w/2 && rx <= obj.w/2 && ry >= -obj.h/2 && ry <= obj.h/2) {
        hit = true;
        offsetX = rx;
        offsetY = ry;
      }
    } else { // circle or guest
      const dx = mx - obj.x, dy = my - obj.y;
      const r = obj.type === 'guest' ? 20 : obj.r;
      if (dx*dx + dy*dy <= r*r) {
        hit = true;
        offsetX = dx;
        offsetY = dy;
      }
    }
    
    if (hit) {
      dragTarget = obj;
      selected   = obj;
      // capture the pointer so we keep getting move/up
      canvas.setPointerCapture(e.pointerId);
      drawAll();
      return;
    }
  }
  
  drawAll(); // clicked on empty space
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragTarget) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  
  if (dragTarget.type === 'rect') {
    const angle = ((dragTarget.rotation||0) * Math.PI) / 180;
    dragTarget.x = mx - (offsetX * Math.cos(angle) + offsetY * Math.sin(angle)) - dragTarget.w/2;
    dragTarget.y = my - (-offsetX * Math.sin(angle) + offsetY * Math.cos(angle)) - dragTarget.h/2;
  } else {
    dragTarget.x = mx - offsetX;
    dragTarget.y = my - offsetY;
  }
  
  drawAll();
});

canvas.addEventListener('pointerup', (e) => {
  if (dragTarget) {
    canvas.releasePointerCapture(e.pointerId);
    dragTarget = null;
  }
});

canvas.addEventListener('pointercancel', (e) => {
  if (dragTarget) {
    canvas.releasePointerCapture(e.pointerId);
    dragTarget = null;
  }
});

/*

canvas.addEventListener("mousedown", (e) => {
  const mx = e.offsetX, my = e.offsetY;
  selected = null;
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.type === "rect") {
      const angle = (obj.rotation || 0) * Math.PI / 180;
      const cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2;
      const dx = mx - cx, dy = my - cy;
      const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
      const ry = dx * Math.sin(-angle) + dy * Math.cos(-angle);
      if (rx >= -obj.w / 2 && rx <= obj.w / 2 && ry >= -obj.h / 2 && ry <= obj.h / 2) {
        dragTarget = obj;
        selected = obj;
        offsetX = rx;
        offsetY = ry;
        drawAll();
        return;
      }
    } else if (obj.type === "circle" || obj.type === "guest") {
      const dx = mx - obj.x, dy = my - obj.y;
      const r = obj.type === "guest" ? 20 : obj.r;
      if (dx * dx + dy * dy <= r * r) {
        dragTarget = obj;
        selected = obj;
        offsetX = dx;
        offsetY = dy;
        drawAll();
        return;
      }
    }
  }
  drawAll();
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragTarget) return;
  if (dragTarget.type === "rect") {
    const angle = (dragTarget.rotation || 0) * Math.PI / 180;
    const mx = e.offsetX, my = e.offsetY;
    dragTarget.x = mx - (offsetX * Math.cos(angle) + offsetY * Math.sin(angle)) - dragTarget.w / 2;
    dragTarget.y = my - (-offsetX * Math.sin(angle) + offsetY * Math.cos(angle)) - dragTarget.h / 2;
  } else {
    dragTarget.x = e.offsetX - offsetX;
    dragTarget.y = e.offsetY - offsetY;
  }
  drawAll();
});

canvas.addEventListener("mouseup", () => dragTarget = null);

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const mx = touch.clientX - rect.left;
  const my = touch.clientY - rect.top;

  selected = null;
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.type === "rect") {
      const angle = (obj.rotation || 0) * Math.PI / 180;
      const cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2;
      const dx = mx - cx, dy = my - cy;
      const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
      const ry = dx * Math.sin(-angle) + dy * Math.cos(-angle);
      if (rx >= -obj.w / 2 && rx <= obj.w / 2 && ry >= -obj.h / 2 && ry <= obj.h / 2) {
        dragTarget = obj;
        selected = obj;
        offsetX = rx;
        offsetY = ry;
        drawAll();
        return;
      }
    } else if (obj.type === "circle" || obj.type === "guest") {
      const dx = mx - obj.x, dy = my - obj.y;
      const r = obj.type === "guest" ? 20 : obj.r;
      if (dx * dx + dy * dy <= r * r) {
        dragTarget = obj;
        selected = obj;
        offsetX = dx;
        offsetY = dy;
        drawAll();
        return;
      }
    }
  }
  drawAll();
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!dragTarget) return;

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const mx = touch.clientX - rect.left;
  const my = touch.clientY - rect.top;

  if (dragTarget.type === "rect") {
    const angle = (dragTarget.rotation || 0) * Math.PI / 180;
    dragTarget.x = mx - (offsetX * Math.cos(angle) + offsetY * Math.sin(angle)) - dragTarget.w / 2;
    dragTarget.y = my - (-offsetX * Math.sin(angle) + offsetY * Math.cos(angle)) - dragTarget.h / 2;
  } else {
    dragTarget.x = mx - offsetX;
    dragTarget.y = my - offsetY;
  }

  drawAll();
}, { passive: false });

canvas.addEventListener("touchend", () => {
  dragTarget = null;
});

  

drawAll();
*/

// ... all din befintliga kod ovanför drawAll() ...

// ritverktyg.js


  
  function drawScalebars() {
    const cmToPx = 0.8; // 1 cm = 0.8 px
    const mToPx = cmToPx * 100; // 1 meter = 80 px
  
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.lineWidth = 1;
    ctx.font = "10px sans-serif";
  
    // Horisontell skalstock centrerad
    const startX = 200;
    const endX = 1400;
    const baseY = canvas.height - 40;
  
    ctx.textAlign = "center";
    for (let m = 0; m <= (endX - startX) / mToPx; m++) {
      const x = startX + m * mToPx;
      if (x > endX) break;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, baseY + 10);
      ctx.stroke();
      ctx.fillText(m + " m", x, baseY + 22);
    }
  
    // Vertikal skalstock centrerad
    const startY = 100;
    const endY = 600;
    const baseX = 60;
  
    ctx.textAlign = "left";
    for (let m = 0; m <= (endY - startY) / mToPx; m++) {
      const y = startY + m * mToPx;
      if (y > endY) break;
      ctx.beginPath();
      ctx.moveTo(baseX - 10, y);
      ctx.lineTo(baseX, y);
      ctx.stroke();
      ctx.fillText(m + " m", baseX + 5, y + 3);
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const hamBtn = document.querySelector('.hamburger');
    const toolbar = document.querySelector('.toolbar-items');
  
    if (hamBtn && toolbar) {
      hamBtn.addEventListener('click', () => {
        const isOpen = toolbar.classList.toggle('active');
        hamBtn.setAttribute('aria-expanded', isOpen);
      });
    }
  });

  // --- Nedladdningsfunktion för checklistan ---
  async function downloadChecklist() {
    const container   = document.getElementById('checklistContainer');
    const closeBtn    = container.querySelector('.close-modal');
    const downloadBtn = container.querySelector('button[onclick="downloadChecklist()"]');
    const controlsDiv = document.getElementById('newChecklistItem').closest('div');
  
    // Hide controls so they don’t show up in the PNG
    closeBtn.style.display    = 'none';
    downloadBtn.style.display = 'none';
    controlsDiv.style.display = 'none';
  
    try {
      // Render at 2× resolution on white background
      const canvas = await html2canvas(container, {
        backgroundColor: '#fff',
        scale: 2
      });
  
      // Convert to blob and trigger download
      canvas.toBlob(blob => {
        const link = document.createElement('a');
        link.download = 'checklista.png';
        link.href     = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');
  
    } catch (err) {
      console.error('Could not capture checklist:', err);
      alert('Något gick fel vid nedladdningen. Prova igen.');
    } finally {
      // Restore buttons
      closeBtn.style.display    = '';
      downloadBtn.style.display = '';
      controlsDiv.style.display = '';
    }
  }

// --- Nedladdningsfunktion för gästlistan ---
async function downloadGuestList() {
  const container = document.getElementById('guestListContainer');
  // Temporarily hide buttons so they don't appear in the image
  const closeBtn    = container.querySelector('.close-modal');
  const downloadBtn = container.querySelector('button[onclick="downloadGuestList()"]');
  closeBtn.style.display = 'none';
  downloadBtn.style.display = 'none';
  
  try {
    // Render the container to canvas (white background, higher resolution)
    const canvas = await html2canvas(container, {
      backgroundColor: '#fff',
      scale: 2
    });
    
    // Convert to blob and trigger download
    canvas.toBlob(blob => {
      const link = document.createElement('a');
      link.download = 'gästlista.png';
      link.href     = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  } catch (err) {
    console.error('Could not capture guest list:', err);
    alert('Något gick fel vid nedladdningen. Prova igen.');
  } finally {
    // Restore buttons
    closeBtn.style.display = '';
    downloadBtn.style.display = '';
  }
}