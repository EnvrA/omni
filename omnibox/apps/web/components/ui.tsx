"use client";
import {
  forwardRef,
  HTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ className = "", ...props }, ref) {
  const base = "px-3 py-1 rounded border shadow-sm";
  const classes = className ? `${base} ${className}` : `${base} bg-white`;
  return <button ref={ref} className={classes} {...props} />;
});

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={"px-2 py-1 rounded border shadow-sm " + className}
      {...props}
    />
  );
});

export const Avatar = ({ label, src }: { label: string; src?: string }) => {
  if (src)
    return (
      <img
        src={src}
        alt={label}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
      {label}
    </span>
  );
};

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className = "", ...props }, ref) {
    return (
      <div
        ref={ref}
        className={"rounded-lg border bg-white p-3 shadow " + className}
        {...props}
      />
    );
  },
);

export const Badge = ({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) => {
  return (
    <span
      style={style}
      className={"rounded-full px-2 py-0.5 text-xs " + className}
    >
      {children}
    </span>
  );
};

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={"w-full rounded border p-2 shadow-sm " + className}
      {...props}
    />
  );
});

export const Spinner = (
  props: React.SVGProps<SVGSVGElement> & { label?: string },
) => {
  const { label = "Loading...", className = "", ...rest } = props;
  return (
    <svg
      role="status"
      aria-label={label}
      className={"h-5 w-5 animate-spin text-gray-500 " + className}
      viewBox="0 0 24 24"
      {...rest}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
      />
    </svg>
  );
};
