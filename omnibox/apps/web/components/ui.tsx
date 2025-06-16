"use client";
import { forwardRef, HTMLAttributes, InputHTMLAttributes } from "react";

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function Button({ className = "", ...props }, ref) {
  return <button ref={ref} className={"px-3 py-1 rounded border " + className} {...props} />;
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={"px-2 py-1 rounded border " + className} {...props} />;
});

export const Avatar = ({ label }: { label: string }) => {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs">
      {label}
    </span>
  );
};

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card({ className = "", ...props }, ref) {
  return <div ref={ref} className={"rounded border p-2 " + className} {...props} />;
});
