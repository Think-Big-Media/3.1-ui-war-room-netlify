import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find the selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      setDropdownPosition({
        top: rect.bottom + scrollY + 4, // 4px gap (mt-1)
        left: rect.left - rect.width * 0.15, // Center with 130% width
        width: rect.width * 1.3,
      });
    }
  };

  // Update position when opening dropdown
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      // Update position on scroll/resize
      const handleUpdate = () => updateDropdownPosition();
      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            updateDropdownPosition();
          }
          setIsOpen(!isOpen);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-between',
          'px-3 py-0.5 rounded-lg text-xs font-mono uppercase',
          'bg-black/10',
          'border border-white/30',
          'text-white/70',
          'hover:bg-white/5 hover:border-white/40',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-white/20',
          'min-w-[112px] h-6',
          className
        )}
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-white/70">{icon}</span>}
          <span className="truncate font-mono uppercase">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div
          className={`ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <ChevronDown className="w-4 h-4 text-white/70" />
        </div>
      </button>

      {/* Dropdown Menu - Rendered via Portal */}
      {typeof document !== 'undefined' &&
        isOpen &&
        createPortal(
          <div
            className={cn(
              'fixed z-[99999]',
              'bg-black/95',
              'rounded',
              'overflow-hidden',
              'animate-in fade-in slide-in-from-top-2 duration-200'
            )}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999,
            }}
          >
            <div className="py-2 max-h-60 overflow-y-auto custom-scrollbar">
              {options
                .filter((option) => option.value !== value)
                .map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm font-mono uppercase',
                      'flex items-center justify-between',
                      'transition-colors duration-200',
                      'text-white/80 hover:bg-white/30 hover:text-white'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      {option.icon && <span className="text-white/70">{option.icon}</span>}
                      <span className="font-mono uppercase">{option.label}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>,
          document.body
        )}

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default CustomDropdown;
