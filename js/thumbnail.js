export function initThumbnail() {
  const container = document.getElementById('tracking-container');
  const header    = document.getElementById('tracking-header');
  const canvas    = document.getElementById('tracking-canvas');

  // Keep canvas pixel dims in sync with container size
  const HEADER_H = header.offsetHeight || 22;

  function syncCanvasSize() {
    canvas.width  = Math.round(container.clientWidth);
    canvas.height = Math.round(container.clientHeight - HEADER_H);
  }

  syncCanvasSize();
  new ResizeObserver(syncCanvasSize).observe(container);

  // ── Drag to reposition ────────────────────────────────
  let dragging = false;
  let startMX, startMY, startLeft, startTop;

  function startDrag(clientX, clientY) {
    dragging = true;
    startMX  = clientX;
    startMY  = clientY;
    // Switch from bottom/right anchoring to top/left so we can freely position
    const rect  = container.getBoundingClientRect();
    startLeft   = rect.left;
    startTop    = rect.top;
    container.style.right  = 'auto';
    container.style.bottom = 'auto';
    container.style.left   = `${startLeft}px`;
    container.style.top    = `${startTop}px`;
  }

  function moveDrag(clientX, clientY) {
    if (!dragging) return;
    let newLeft = startLeft + clientX - startMX;
    let newTop  = startTop  + clientY - startMY;
    // Keep within viewport
    newLeft = Math.min(Math.max(newLeft, 0), window.innerWidth  - container.offsetWidth);
    newTop  = Math.min(Math.max(newTop,  0), window.innerHeight - container.offsetHeight);
    container.style.left = `${newLeft}px`;
    container.style.top  = `${newTop}px`;
  }

  const stopDrag = () => { dragging = false; };

  // Mouse
  header.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
  document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', stopDrag);

  // Touch
  header.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchend', stopDrag);
}
