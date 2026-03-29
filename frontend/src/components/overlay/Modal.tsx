"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect, useRef, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap: trap Tab within the modal, close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  // Save previous focus on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Focus the close button after render
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-[#0d0d0d] border border-yellow-400/20 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ boxShadow: "0 0 20px rgba(234,179,8,0.35), 0 0 40px rgba(234,179,8,0.1), 0 25px 50px rgba(0,0,0,0.9)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/25 bg-black/40">
          <h2 className="font-mono text-lg font-bold uppercase tracking-widest text-yellow-400">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-yellow-400/15 rounded-lg text-slate-400 hover:text-yellow-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-slate-300 text-sm leading-relaxed overflow-y-auto">
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
