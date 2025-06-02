import React from "react";

interface HamburgerButtonProps {
  isOpen: boolean;
  toggle: () => void;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ isOpen, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="relative w-8 h-8 flex flex-col justify-center items-center group"
      aria-label="Toggle menu"
    >
      <span
        className={`bg-black h-0.5 w-6 absolute transition-all duration-300 ${
          isOpen ? "rotate-45 top-3.5" : "top-2"
        }`}
      ></span>
      <span
        className={`bg-black h-0.5 w-6 absolute transition-all duration-300 ${
          isOpen ? "opacity-0" : "top-3.5"
        }`}
      ></span>
      <span
        className={`bg-black h-0.5 w-6 absolute transition-all duration-300 ${
          isOpen ? "-rotate-45 top-3.5" : "top-5"
        }`}
      ></span>
    </button>
  );
};

export default HamburgerButton;