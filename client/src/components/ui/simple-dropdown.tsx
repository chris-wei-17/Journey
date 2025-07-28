import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SimpleDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SimpleDropdown({ trigger, children, className = "" }: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute top-full left-0 mt-2 z-50 bg-white rounded-md shadow-lg border min-w-[200px] ${className}`}
          style={{
            transform: 'translateZ(0)', // Force GPU acceleration
            willChange: 'auto',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}