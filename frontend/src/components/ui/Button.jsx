import { LoaderCircle } from 'lucide-react';

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-indigo-500'
};
const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
