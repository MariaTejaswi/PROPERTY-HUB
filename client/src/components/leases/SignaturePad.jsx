import React, { useRef, useState, useEffect } from 'react';
import Button from '../common/Button';
import styles from './SignaturePad.module.css';

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
    <div className={styles.signaturePad}>
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className={styles.placeholder}>
            Sign here
          </div>
        )}
      </div>
      
      <div className={styles.buttons}>
        <Button variant="outline" onClick={clear}>
          Clear
        </Button>
        <Button onClick={save} disabled={isEmpty}>
          Save Signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
