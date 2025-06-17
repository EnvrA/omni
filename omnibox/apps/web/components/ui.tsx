"use client";
import { forwardRef, HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function Button({ className = "", ...props }, ref) {
  return <button ref={ref} className={"px-3 py-1 rounded border shadow-sm bg-white " + className} {...props} />;
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={"px-2 py-1 rounded border shadow-sm " + className} {...props} />;
});

export const Avatar = ({ label }: { label: string }) => {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
      {label}
    </span>
  );
};

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card({ className = "", ...props }, ref) {
  return <div ref={ref} className={"rounded-lg border bg-white p-3 shadow " + className} {...props} />;
});

export const Badge = ({ className = "", children }: { className?: string; children: React.ReactNode }) => {
  return <span className={"rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 " + className}>{children}</span>;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className = "", ...props }, ref) {
  return <textarea ref={ref} className={"w-full rounded border p-2 shadow-sm " + className} {...props} />;
});
