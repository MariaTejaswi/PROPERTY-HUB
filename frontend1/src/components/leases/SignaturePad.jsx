import React, { useRef, useState, useEffect } from 'react';
import Button from '../common/Button';

const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setContext(ctx);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);
    
    if (context) {
      const coords = getCoordinates(e);
      context.beginPath();
      context.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !context) return;
    
    const coords = getCoordinates(e);
    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (context) {
      context.closePath();
    }
  };

  const clear = () => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setIsEmpty(true);
      if (onClear) onClear();
    }
  };

  const save = () => {
    if (canvasRef.current && !isEmpty) {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onSave(dataURL);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      <div className="relative bg-gray-50">
        <canvas
          ref={canvasRef}
          className="w-full h-64 cursor-crosshair touch-none bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-lg font-medium">✍️ Sign here</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-200">
        <Button variant="outline" onClick={clear} fullWidth>
          Clear
        </Button>
        <Button onClick={save} disabled={isEmpty} fullWidth>
          Save Signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
