import { useState, useRef, useCallback } from "react";
import { X, Check, RotateCcw } from "lucide-react";

export default function ImageCropModal({ imageSrc, onCrop, onCancel }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = useCallback(async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;
    
    if (!img) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerSize = Math.min(containerRect.width, containerRect.height);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth, drawHeight;
    
    if (imgAspect > 1) {
      drawHeight = containerSize * scale;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = containerSize * scale;
      drawHeight = drawWidth / imgAspect;
    }

    const centerX = containerSize / 2 + position.x;
    const centerY = containerSize / 2 + position.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    const offsetX = (size - drawWidth) / 2 + position.x;
    const offsetY = (size - drawHeight) / 2 + position.y;

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    canvas.toBlob((blob) => {
      const file = new File([blob], "cropped-profile.jpg", { type: "image/jpeg" });
      onCrop(file);
    }, "image/jpeg", 0.9);
  }, [scale, rotation, position, onCrop]);

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Crop Profile Picture</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div
            ref={containerRef}
            className="relative w-64 h-64 mx-auto rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="w-full h-full object-cover cursor-move select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              }}
              draggable={false}
              onMouseDown={handleMouseDown}
            />
            <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-full pointer-events-none" />
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Zoom: {Math.round(scale * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Rotation: {rotation}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Drag to position, use sliders to zoom and rotate
          </p>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer border-none"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-colors cursor-pointer border-none"
          >
            <Check className="w-4 h-4" /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
