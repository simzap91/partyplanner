const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const objects = [];
let dragTarget = null;
let offsetX = 0;
let offsetY = 0;
let selected = null;
let nextTableNumber = 1;
let showAxes = false;
let hasCentered = false;  // HÄR

function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  const extraWidth = window.innerWidth < 600
    ? window.innerWidth  * 2
    : window.innerWidth * 0.5;
  //const extraHeight = window.innerHeight * 0.5; //HÄR

  const extraHeight = window.innerWidth < 600
    ? window.innerHeight * 1
    : window.innerHeight * 0.5;

  const w = window.innerWidth + extraWidth;
  const h = window.innerHeight + extraHeight;

  canvas.width  = w * scale;
  canvas.height = h * scale;

  canvas.style.width  = w + "px";
  canvas.style.height = h + "px";

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawAll();

  if (!hasCentered) {
    window.scrollTo((canvas.width - window.innerWidth) / 2, 0);  // HÄR
    hasCentered = true;
  }
  //window.scrollTo((canvas.width - window.innerWidth) / 2, 0); // HÄR
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && measuring) {
      measuring = false;
      measureStart = null;
      alert("Mätning avbruten.");
    }
  });

function drawAll() {
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

  for (const obj of objects) {
    ctx.lineWidth = obj === selected ? 3 : 1;
    ctx.strokeStyle = "#000";

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
   
   // Flytta ner till ca 95% av canvasens höjd och bredd
   const x = canvas.width * 0.49;
   const y = canvas.height * 0.50;
   
   ctx.fillText("EverAfterbyEster", x, y);
   if (showAxes) {
    const meterToPx = 80;
    const viewCenterX = window.scrollX + window.innerWidth / 2;
    const viewCenterY = window.scrollY + window.innerHeight / 2;
  
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
  
    // Rita x-axeln
    ctx.beginPath();
    ctx.moveTo(0, viewCenterY);
    ctx.lineTo(canvas.width, viewCenterY);
    ctx.stroke();
  
    // Rita y-axeln
    ctx.beginPath();
    ctx.moveTo(viewCenterX, 0);
    ctx.lineTo(viewCenterX, canvas.height);
    ctx.stroke();
  
    ctx.setLineDash([]);
    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
  
    // Märkningar längs x-axeln
    for (let x = -10; x <= 20; x++) {
      const px = viewCenterX + x * meterToPx;
      if (px < 0 || px > canvas.width) continue;
      ctx.beginPath();
      ctx.moveTo(px, viewCenterY - 5);
      ctx.lineTo(px, viewCenterY + 5);
      ctx.stroke();
      if (x !== 0) ctx.fillText(`${x} m`, px, viewCenterY + 8);
    }
  
    // Märkningar längs y-axeln
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

function onTitleChange() {
  const text = document.getElementById('titleInput').value;
  document.getElementById('titleDisplay').textContent = text;
}

function updateFloatingButtons() {
  const floatingButtons = document.getElementById('floatingButtons');
  const buttons = floatingButtons.querySelectorAll('button');
  
  if (!selected) {
    // No selection - disable all buttons
    floatingButtons.classList.add('disabled');
    buttons.forEach(btn => btn.disabled = true);
    return;
  }

  floatingButtons.classList.remove('disabled');
  
  // Enable/disable buttons based on selected type
  buttons.forEach(btn => {
    const action = btn.getAttribute('onclick');
    
    if (selected.type === "guest") {
      btn.disabled = (action !== "removeSelected()");
    } 
    else if (selected.type === "circle") {
      btn.disabled = (action === "rotateSelected()");
    } 
    else { // rect or other types
      btn.disabled = false;
    }
  });
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
    updateFloatingButtons();

    // If there are no more tables (rectangles or circles) on the canvas, reset numbering
    const hasAnyTable = objects.some(obj => obj.type === 'rect' || obj.type === 'circle');
    if (!hasAnyTable) {
      nextTableNumber = 1;
    }
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
  const scale    = window.devicePixelRatio || 1;
  const pxPerM   = 80;
  const pad      = 20;
  const maxPadM  = 50;
  const maxPad   = maxPadM * pxPerM;

  // height reserved for the title area (in CSS-px)
  const titleArea = 40;

  // half-size on mobile
  const isMobile = window.innerWidth <= 600;
  const baseMinW = 15 * pxPerM;
  const baseMinH = 10 * pxPerM;
  const minW     = isMobile ? baseMinW / 2 : baseMinW;
  const minH     = isMobile ? baseMinH / 2 : baseMinH;

  const worldW = canvas.width  / scale;
  const worldH = canvas.height / scale;

  let regionX0, regionY0, regionX1, regionY1;
  const padPx = Math.min(pad, maxPad);

  // 1) Determine our crop region (same logic as before)
  if (objects.length === 0) {
    regionX0 = 0;
    regionY0 = 0;
    regionX1 = Math.min(minW, worldW);
    regionY1 = Math.min(minH, worldH);
  } else {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    for (const obj of objects) {
      if (obj.type === 'circle' || obj.type === 'guest') {
        const r = obj.type === 'guest' ? 20 : obj.r;
        minX = Math.min(minX, obj.x - r);
        minY = Math.min(minY, obj.y - r);
        maxX = Math.max(maxX, obj.x + r);
        maxY = Math.max(maxY, obj.y + r);
      } else {
        const angle = (obj.rotation||0) * Math.PI/180;
        const cx = obj.x + obj.w/2, cy = obj.y + obj.h/2;
        const dx = Math.abs(Math.cos(angle)*obj.w/2)
                 + Math.abs(Math.sin(angle)*obj.h/2);
        const dy = Math.abs(Math.sin(angle)*obj.w/2)
                 + Math.abs(Math.cos(angle)*obj.h/2);
        minX = Math.min(minX, cx - dx);
        minY = Math.min(minY, cy - dy);
        maxX = Math.max(maxX, cx + dx);
        maxY = Math.max(maxY, cy + dy);
      }
    }

    // width
    if (maxX <= minW) {
      regionX0 = 0;
      regionX1 = Math.min(minW, worldW);
    } else {
      regionX0 = Math.max(0, minX - padPx);
      regionX1 = Math.min(worldW, maxX + padPx);
    }
    // height
    if (maxY <= minH) {
      regionY0 = 0;
      regionY1 = Math.min(minH, worldH);
    } else {
      regionY0 = Math.max(0, minY - padPx);
      regionY1 = Math.min(worldH, maxY + padPx);
    }
  }

  // 2) Draw into an offscreen canvas that’s taller by titleArea
  const w = regionX1 - regionX0;
  const h = regionY1 - regionY0;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width  = w * scale;
  exportCanvas.height = (h + titleArea) * scale;
  const ec = exportCanvas.getContext('2d');
  ec.setTransform(scale, 0, 0, scale, 0, 0);

  // 2a) fill the top stripe with the canvas bg
  ec.fillStyle = '#fffdf8';
  ec.fillRect(0, 0, w, titleArea);

  // 2b) draw the table‐layout region below
  ec.drawImage(
    canvas,
    regionX0 * scale, regionY0 * scale,
    w * scale,         h * scale,
    0,                 titleArea,
    w,                 h
  );

  // 3) Stamp the title into that top stripe
  ec.save();
  ec.fillStyle    = '#111';
  ec.font         = "bold 24px 'Segoe UI', sans-serif";  // smaller text
  ec.textAlign    = 'center';
  ec.textBaseline = 'middle';
  ec.fillText(
    document.getElementById('titleInput').value,
    w / 2,           // center horizontally
    titleArea / 2    // center vertically in the stripe
  );
  ec.restore();

  // 4) Trigger download
  const link = document.createElement('a');
  link.download = 'bordsplacering.png';
  link.href     = exportCanvas.toDataURL('image/png');
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

  document.getElementById('guestModalOverlay').style.display = 'block';
  document.getElementById('guestListContainer').style.display = 'block';
}

function closeGuestList() {
  document.getElementById('guestModalOverlay').style.display = 'none';
  document.getElementById('guestListContainer').style.display = 'none';
}

function createChecklist() {
  document.getElementById('modalOverlay').style.display = 'block';
  document.getElementById('checklistContainer').style.display = 'block';
}

function closeChecklist() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('checklistContainer').style.display = 'none';
}

function addChecklistItem() {
  const ul = document.getElementById('checklist');
  const text = document.getElementById('newChecklistItem').value.trim();
  if (!text) return;

  const li = document.createElement('li');
  li.innerHTML = `
    <label>
      <input type="checkbox"> ${text}
    </label>
    <button class="remove-item">Ta bort</button>
    `;
  
  li.querySelector('.remove-item')
    .addEventListener('click', removeChecklistItem);
  
  ul.appendChild(li);
  document.getElementById('newChecklistItem').value = '';
}

function removeChecklistItem(event) {
  const li = event.target.closest('li');
  if (li) li.remove();
}

async function downloadChecklist() {
  const container   = document.getElementById('checklistContainer');
  const closeBtn    = document.getElementById('closeChecklistBtn');
  const downloadBtn = document.getElementById('downloadChecklistBtn');
  const controlsDiv = container.querySelector('.controls');

  // 1) Hide UI chrome
  closeBtn.style.display    = 'none';
  downloadBtn.style.display = 'none';
  controlsDiv.style.display = 'none';

  // 2) Temporarily remove height/overflow constraints *and* horizontal clipping
  const oldMaxH      = container.style.maxHeight;
  const oldOverflowY = container.style.overflowY;
  const oldOverflowX = container.style.overflowX;
  container.style.maxHeight = 'none';
  container.style.overflowY = 'visible';
  container.style.overflowX = 'visible';   // ← allow all text to show
  container.scrollTop       = 0;            // scroll to top

  try {
    // 3) Capture full expanded modal
    const c = await html2canvas(container, {
      backgroundColor: '#fff',
      scale: 2
    });

    // 4) Download PNG as before
    const dataURL = c.toDataURL('image/png');
    const a       = document.createElement('a');
    a.href        = dataURL;
    a.download    = 'checklista.png';

    if (typeof a.download === 'undefined') {
      window.open(dataURL, '_blank');
    } else {
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

  } catch (err) {
    console.error('Could not capture checklist:', err);
    alert('Något gick fel vid nedladdningen. Prova igen.');
  } finally {
    // 5) Restore UI & scrolling + clipping
    closeBtn.style.display     = '';
    downloadBtn.style.display  = '';
    controlsDiv.style.display  = '';
    container.style.maxHeight  = oldMaxH;
    container.style.overflowY  = oldOverflowY;
    container.style.overflowX  = oldOverflowX;
  }
}

// --- Nedladdningsfunktion för gästlistan ---
async function downloadGuestList() {
  const container   = document.getElementById('guestListContainer');
  const closeBtn    = container.querySelector('.close-modal');
  const downloadBtn = container.querySelector('button[onclick="downloadGuestList()"]');

  // hide the buttons so they don’t appear in the snapshot
  closeBtn.style.display    = 'none';
  downloadBtn.style.display = 'none';

  try {
    // render to an off‐screen canvas
    const c = await html2canvas(container, {
      backgroundColor: '#fff',
      scale: 2
    });

    // get a base64 data URL synchronously
    const dataURL = c.toDataURL('image/png');

    // create a temporary <a>
    const a = document.createElement('a');
    a.href     = dataURL;
    a.download = 'gastlista.png';

    // if download attribute unsupported, open in new tab
    if (typeof a.download === 'undefined') {
      window.open(dataURL, '_blank');
    } else {
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

  } catch (err) {
    console.error('Could not capture guest list:', err);
    alert('Något gick fel vid nedladdningen. Prova igen.');
  } finally {
    // restore buttons
    closeBtn.style.display    = '';
    downloadBtn.style.display = '';
  }
}

function toggleAxes() {
  showAxes = !showAxes;
  drawAll();
}

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
        updateFloatingButtons();
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
        updateFloatingButtons();
        return;
      }
    }
  }
  drawAll();
  updateFloatingButtons();
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

//canvas.addEventListener("mouseup", () => dragTarget = null);

canvas.addEventListener("mouseup", () => {
  if (!dragTarget && selected) {
    // Clear selection when clicking empty space
    selected = null;
    drawAll();
    updateFloatingButtons(); // ADD THIS LINE
  }
  dragTarget = null;
});

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
        updateFloatingButtons();
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
        updateFloatingButtons();
        return;
      }
    }
  }
  drawAll();
  updateFloatingButtons();
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
    // Logga om vi drar ett objekt eller inte
    const active = !!dragTarget;
    console.log("touchmove, dragging?", active);
  
    // Hämta första touchen
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
  
    // Om inget objekt är aktivt, släpp igenom scroll
    if (!dragTarget) {
      return;  // inga preventDefault → containern scrollar
    }
  
    // Förhindra sid-scroll bara när vi drar ett objekt
    e.preventDefault();
  
    // --- din befintliga drag-logik ---
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

// This function binds the click event to the close button of the site notice.
// It uses addEventListener for more robust event handling.
function bindClose() {
  const closeBtn = document.getElementById('closeSiteNoticeBtn');
  const notice = document.getElementById('siteNotice');
  if (closeBtn && notice) {
      // Remove any existing click listeners to prevent duplicate bindings
      // This is important if bindClose is called multiple times for the same element
      closeBtn.removeEventListener('click', hideSiteNotice); // Ensure we remove the specific handler
      // Add the new click listener
      closeBtn.addEventListener('click', hideSiteNotice);
  }
}

// Handler function to hide the site notice
function hideSiteNotice() {
  const notice = document.getElementById('siteNotice');
  if (notice) {
      notice.style.display = 'none';
  }
}

// This function displays the site notice and ensures the close button is bound.
function showSiteNotice() {
  const notice = document.getElementById('siteNotice');
  if (notice) {
      notice.style.display = 'block'; // Make the notice visible
      bindClose(); // Ensure the close button's event listener is attached
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const hamBtn   = document.querySelector('.hamburger');
  const toolbar  = document.querySelector('.toolbar-items');

  // open modal
  document
    .getElementById('openChecklistBtn')
    .addEventListener('click', createChecklist);

  // add item
  document
    .getElementById('addChecklistItemBtn')
    .addEventListener('click', addChecklistItem);

  // download
  document
    .getElementById('downloadChecklistBtn')
    .addEventListener('click', downloadChecklist);

  // close modal via “×” button or backdrop
  document
    .getElementById('closeChecklistBtn')
    .addEventListener('click', closeChecklist);
  document
    .getElementById('modalOverlay')
    .addEventListener('click', closeChecklist);

  document.querySelectorAll('#checklist .remove-item')
    .forEach(btn => btn.addEventListener('click', removeChecklistItem));

  updateFloatingButtons();

  if (hamBtn && toolbar) {
    // 1) Toggle open/close on hamburger
    hamBtn.addEventListener('click', () => {
      const isOpen = toolbar.classList.toggle('active');
      hamBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // 2) Close menu after clicking any action button
    toolbar.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        toolbar.classList.remove('active');
        hamBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

window.addEventListener('load', () => {
  resizeCanvas();
  updateFloatingButtons();
});

window.addEventListener('orientationchange', () => {
  resizeCanvas();
});

// CRITICAL FIX: This event fires when the page is loaded from the browser's
// back/forward cache (bfcache). In this scenario, DOMContentLoaded and load
// might not fire, but pageshow will. We need to re-show the notice and re-bind
// its events to ensure functionality after bfcache restoration.
window.addEventListener('pageshow', (event) => {
  // This will run on initial load, reload, and bfcache restore,
  // guaranteeing the notice and its button always work.
  console.log('Page is being displayed. Ensuring site notice is functional.');
  showSiteNotice();
});
