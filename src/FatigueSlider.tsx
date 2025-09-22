import React, { useState, useRef } from 'react';

interface FatigueSliderProps {
  onConfirm: () => void;
  label: string;
  color?: string;
}

export function FatigueSlider({ onConfirm, label, color = '#ccc' }: FatigueSliderProps) {
  const [value, setValue] = useState(0);
  const [isEngaged, setIsEngaged] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  const handleMouseUp = () => {
    if (value === 100) {
      onConfirm();
    }
    // Reset slider smoothly
    if (sliderRef.current) {
      sliderRef.current.style.transition = 'width 0.3s ease-in-out';
      setValue(0);
    }
    setIsEngaged(false);
  };

  const handleMouseDown = () => {
    if (sliderRef.current) {
      sliderRef.current.style.transition = 'none';
    }
    setIsEngaged(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(e.target.value, 10));
  };

  const progress = value / 100;
  const sliderStyle = {
    background: `linear-gradient(90deg, ${color} ${progress * 100}%, #efefef ${progress * 100}%)`,
  };

  return (
    <div className="fatigue-slider-container">
      <input
        ref={sliderRef}
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown} // for mobile
        onTouchEnd={handleMouseUp}     // for mobile
        className="fatigue-slider"
        style={sliderStyle}
      />
      <span className={`slider-label ${isEngaged || value > 0 ? 'hidden' : ''}`}>
        {label}
      </span>
    </div>
  );
}
