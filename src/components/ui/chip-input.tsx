import React, { useState, KeyboardEvent, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipInputProps {
  value: string[];
  onChange: (chips: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ChipInput: React.FC<ChipInputProps> = ({
  value,
  onChange,
  placeholder = "Type brand names and press comma...",
  disabled = false,
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addChip();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last chip if input is empty and backspace is pressed
      removeChip(value.length - 1);
    }
  };

  const addChip = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue('');
    }
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    // Add chip on blur if there's input
    if (inputValue.trim()) {
      addChip();
    }
  };

  return (
    <div className={cn(
      "flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background",
      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      {value.map((chip, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
        >
          <span>{chip}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeChip(index)}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={disabled}
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
      />
    </div>
  );
};
