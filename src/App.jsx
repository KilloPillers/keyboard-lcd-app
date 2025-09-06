import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const PIXEL_SIZE = 14; // try making this bigger to see the effect clearly
const LCD_WIDTH = 128;
const LCD_HEIGHT = 32;

var URL;
if (import.meta.env.MODE === "development") {
  URL = "http://localhost:3000";
} else {
  URL = "nodejs-production-9769.up.railway.app";
}

const socket = io(URL);

function pixelsToByteArray(pixels) {
  const bytesPerRow = LCD_WIDTH / 8;
  const buffer = new Uint8Array(LCD_HEIGHT * bytesPerRow);

  for (let row = 0; row < LCD_HEIGHT; row++) {
    for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        byte = (byte << 1) | pixels[row][byteIndex * 8 + bit];
      }
      buffer[row * bytesPerRow + byteIndex] = byte;
    }
  }

  return buffer; // Uint8Array of 512 bytes
}

function byteArrayToPixels(byteArray) {
  const bytesPerRow = LCD_WIDTH / 8;
  const pixels = Array.from({ length: LCD_HEIGHT }, () =>
    Array(LCD_WIDTH).fill(0),
  );

  for (let byteIndex = 0; byteIndex < byteArray.length; byteIndex++) {
    const row = Math.floor(byteIndex / bytesPerRow);
    const colByte = byteIndex % bytesPerRow;
    const byte = byteArray[byteIndex];
    for (let bit = 0; bit < 8; bit++) {
      pixels[row][colByte * 8 + bit] = (byte >> (7 - bit)) & 1;
    }
  }

  return pixels;
}

function App() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  // default drawing color
  const color = useRef(1); // 1 - white 0 - black
  const [penSize, setPenSize] = useState(1);
  const [pixels, setPixels] = useState();

  // 2d pixel buffer
  const pixelsRef = useRef(
    Array.from({ length: LCD_HEIGHT }, () => Array(LCD_WIDTH).fill(0)),
  );

  // prevx and y used for line drawing algorithm
  let prevX = null;
  let prevY = null;

  useEffect(() => {
    socket.on("DrawEvent", (byteArrayBuffer) => {
      const byteArray = new Uint8Array(byteArrayBuffer);
      const newPixels = byteArrayToPixels(byteArray);
      setPixels(newPixels);
      pixelsRef.current = newPixels;
    });

    return () => {
      socket.off("DrawEvent");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function setPixel(x, y, state) {
      // Bounds check
      if (x < 0 || x >= LCD_WIDTH || y < 0 || y >= LCD_HEIGHT) return;

      // Update pixel buffer
      pixelsRef.current[y][x] = color.current;

      // Draw on canvas
      drawPixel(x, y, state);
    }

    // Pixel drawing function
    function drawPixel(x, y, state) {
      // fill square
      ctx.fillStyle = state ? "white" : "black";
      ctx.fillRect(
        x * PIXEL_SIZE + 1,
        y * PIXEL_SIZE + 1,
        PIXEL_SIZE - 2,
        PIXEL_SIZE - 2,
      );
    }

    // Pen drawing function (draws multiple pixels based on pensize)
    function drawPixelWithPen(x, y, state, size) {
      const offset = Math.floor(size / 2);
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          setPixel(x + dx - offset, y + dy - offset, state);
        }
      }
    }

    function redraw() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#ccc";
      for (let x = 0; x <= LCD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * PIXEL_SIZE, 0);
        ctx.lineTo(x * PIXEL_SIZE, LCD_HEIGHT * PIXEL_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= LCD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * PIXEL_SIZE);
        ctx.lineTo(LCD_WIDTH * PIXEL_SIZE, y * PIXEL_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y < LCD_HEIGHT; y++) {
        for (let x = 0; x < LCD_WIDTH; x++) {
          drawPixel(x, y, pixelsRef.current[y][x]);
        }
      }
    }

    redraw();

    // Bresenham’s line algorithm
    function drawLine(x0, y0, x1, y1) {
      let dx = Math.abs(x1 - x0);
      let dy = Math.abs(y1 - y0);
      let sx = x0 < x1 ? 1 : -1;
      let sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        drawPixelWithPen(x0, y0, color.current, penSize);
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
    }

    // Event handlers
    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
      prevX = x;
      prevY = y;
      isDrawingRef.current = true;
      drawPixelWithPen(x, y, color.current, penSize);
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);

      if (x !== prevX || y !== prevY) {
        drawLine(prevX, prevY, x, y);
        prevX = x;
        prevY = y;
      }
    };

    const handleMouseUp = () => {
      prevX = null;
      prevY = null;
      setPixels(pixelsRef.current);
      const byteArray = pixelsToByteArray(pixelsRef.current);
      if (isDrawingRef.current) socket.emit("DrawEvent", byteArray);
      isDrawingRef.current = false;
    };

    // Attach listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Cleanup
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [penSize, pixels]);

  const clearCanvas = () => {
    setPixels(
      Array.from({ length: LCD_HEIGHT }, () => Array(LCD_WIDTH).fill(0)),
    );
    pixelsRef.current = Array.from({ length: LCD_HEIGHT }, () =>
      Array(LCD_WIDTH).fill(0),
    );
    const byteArray = pixelsToByteArray(pixelsRef.current);
    socket.emit("DrawEvent", byteArray);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      {/* Explanation Section */}
      <div
        style={{ maxWidth: "800px", marginBottom: "2rem", textAlign: "center" }}
      >
        <h1>Draw Something To My LCD</h1>
        <p>
          I made a web portal where anyone can live update my keyboard's lcd.
          Want to find out how I did this?
        </p>
        <a>Read Here</a>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <button onClick={() => (color.current = 1)}>White</button>
        <button onClick={() => (color.current = 0)}>Black</button>
        <label>
          Pen Size:
          <select
            value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <button onClick={clearCanvas}>Clear Canvas</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={LCD_WIDTH * PIXEL_SIZE}
        height={LCD_HEIGHT * PIXEL_SIZE}
        style={{ border: "2px solid grey", imageRendering: "pixelated" }}
      />
    </div>
  );
}

export default App;
