import { cloneElement, forwardRef, isValidElement } from 'react';

const Input = forwardRef(function Input({ label, error, icon, id, className = '', ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>{label}</label>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {isValidElement(icon) ? cloneElement(icon, { size: 18, 'aria-hidden': true }) : icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${icon ? 'pl-10' : ''} ${error ? 'border-rose-400' : 'border-slate-300'} ${className}`}
          {...props}
        />
      </div>
      {error && <p id={`${inputId}-error`} className="text-sm text-rose-600">{error}</p>}
    </div>
  );
});

export default Input;
