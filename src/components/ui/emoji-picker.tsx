import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Button } from "@/components/ui/button";
import { Smile } from 'lucide-react';

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EmojiPickerButton: React.FC<EmojiPickerButtonProps> = ({ 
  onEmojiSelect, 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emojiData: any) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 text-secondary-action hover:text-secondary-action-hover hover:bg-muted rounded-none ${className}`}
      >
        <Smile size={18} />
      </Button>
      
      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute top-full right-0 z-50 mt-2"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={true}
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;