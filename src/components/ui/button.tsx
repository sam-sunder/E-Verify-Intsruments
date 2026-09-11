import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet"; icon?: ReactNode };

export function Button({ variant = "primary", icon, className = "", children, ...props }: ButtonProps) {
  return <button className={`button button-${variant} ${className}`} {...props}>{icon}{children}</button>;
}

export function IconButton({ label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} title={label} className={`icon-button ${className}`} {...props}>{children}</button>;
}