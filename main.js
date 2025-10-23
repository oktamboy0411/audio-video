document.addEventListener("DOMContentLoaded", () => {
  console.log("main.js loaded");
  const container = document.querySelector(".container");
  if (!container) return;

  // Add a small hint below media elements
  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent =
    "Tip: use the controls to play/pause. Autoplay may be blocked by some browsers.";
  container.appendChild(hint);

  // If video exists, toggle muted state on click to allow autoplay in some browsers
  const video = container.querySelector("video");
  if (video) {
    video.addEventListener("click", () => {
      video.muted = !video.muted;
      console.log("video muted:", video.muted);
    });
  }

  // ---- Canvas drawing logic ----
  const canvas = document.getElementById("drawCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  // HiDPI support
  function resizeCanvasToDisplaySize() {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (
      canvas.width !== Math.round(w * ratio) ||
      canvas.height !== Math.round(h * ratio)
    ) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      canvas.style.height = h + "px";
      ctx.scale(ratio, ratio);
      ctx.putImageData(imageData, 0, 0);
    }
  }
  // initial resize
  resizeCanvasToDisplaySize();
  window.addEventListener("resize", resizeCanvasToDisplaySize);

  const colorPicker = document.getElementById("colorPicker");
  const sizePicker = document.getElementById("sizePicker");
  const clearBtn = document.getElementById("clearBtn");
  const saveBtn = document.getElementById("saveBtn");

  function setStrokeStyle() {
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = parseInt(sizePicker.value, 10) || 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
  setStrokeStyle();

  colorPicker.addEventListener("input", setStrokeStyle);
  sizePicker.addEventListener("input", setStrokeStyle);

  function pointerDown(e) {
    drawing = true;
    const r = canvas.getBoundingClientRect();
    lastX = e.clientX - r.left;
    lastY = e.clientY - r.top;
  }

  function pointerMove(e) {
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
  }

  function pointerUp() {
    drawing = false;
  }

  // Pointer events for broad device support
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerup", pointerUp);

  // Prevent gestures on touch
  canvas.addEventListener("touchstart", (e) => e.preventDefault(), {
    passive: false,
  });

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  saveBtn.addEventListener("click", () => {
    // Create a temporary link to download the canvas image
    const link = document.createElement("a");
    link.download = "drawing.png";
    // Use toDataURL at device pixel ratio level: create an offscreen canvas with desired pixel size
    const ratio = window.devicePixelRatio || 1;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");
    // If canvas was scaled for HiDPI, we can copy directly
    exportCtx.drawImage(canvas, 0, 0);
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  });

  // ---- SVG bar chart (static data) ----
  const chartSvg = document.getElementById("chartSvg");
  if (chartSvg) {
    // Static data: product sales by month (example)
    const data = [
      { label: "Yan", value: 120 },
      { label: "Fev", value: 150 },
      { label: "Mar", value: 180 },
      { label: "Apr", value: 90 },
      { label: "May", value: 220 },
      { label: "Iyun", value: 75 },
    ];

    function renderChart(svg, data) {
      // Clear previous
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      const viewW = 800;
      const viewH = 400;
      const margin = { top: 20, right: 20, bottom: 50, left: 50 };
      const width = viewW - margin.left - margin.right;
      const height = viewH - margin.top - margin.bottom;

      // scales
      const max = Math.max(...data.map((d) => d.value));
      const xStep = width / data.length;

      // Create group
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("transform", `translate(${margin.left},${margin.top})`);
      svg.appendChild(g);

      // Y axis ticks
      const ticks = 5;
      for (let i = 0; i <= ticks; i++) {
        const yVal = (max / ticks) * i;
        const y = height - (yVal / max) * height;
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", 0);
        line.setAttribute("x2", width);
        line.setAttribute("y1", y);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "#eef2fb");
        g.appendChild(line);

        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.setAttribute("x", -10);
        text.setAttribute("y", y + 4);
        text.setAttribute("text-anchor", "end");
        text.classList.add("axis");
        text.textContent = Math.round(yVal);
        g.appendChild(text);
      }

      // Bars
      data.forEach((d, i) => {
        const barW = xStep * 0.6;
        const x = i * xStep + (xStep - barW) / 2;
        const barH = (d.value / max) * height;
        const y = height - barH;

        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barW);
        rect.setAttribute("height", barH);
        rect.classList.add("bar");
        g.appendChild(rect);

        const label = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        label.setAttribute("x", x + barW / 2);
        label.setAttribute("y", height + 18);
        label.setAttribute("text-anchor", "middle");
        label.classList.add("bar-label");
        label.textContent = d.label;
        g.appendChild(label);
      });
    }

    renderChart(chartSvg, data);
    // Re-render on window resize to respect viewBox scaling if needed
    window.addEventListener("resize", () => renderChart(chartSvg, data));
  }
});
