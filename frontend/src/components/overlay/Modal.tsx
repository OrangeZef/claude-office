"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0d0d0d] border border-yellow-400/20 rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ boxShadow: "0 0 20px rgba(234,179,8,0.35), 0 0 40px rgba(234,179,8,0.1), 0 25px 50px rgba(0,0,0,0.9)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/25 bg-black/40">
          <h2 className="font-mono text-lg font-bold uppercase tracking-widest text-yellow-400">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-yellow-400/15 rounded-lg text-slate-400 hover:text-yellow-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-slate-300 text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-yellow-400/25 bg-black/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
