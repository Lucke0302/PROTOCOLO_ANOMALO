import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-navy-blue bg-navy-blue text-white hover:bg-navy-blue-800 hover:border-navy-blue-800 disabled:border-gray-300 disabled:bg-gray-300 disabled:text-white',
  secondary:
    'border-black bg-white text-black hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400',
  ghost:
    'border-transparent bg-transparent text-gray-600 hover:border-gray-300 hover:text-black',
}

export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-blue disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
