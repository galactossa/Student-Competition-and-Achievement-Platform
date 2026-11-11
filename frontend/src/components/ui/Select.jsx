import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, id, children, className = '', ...props }, ref) {
  const selectId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">{label}</label>}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${error ? 'border-rose-400' : 'border-slate-300'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p id={`${selectId}-error`} className="text-sm text-rose-600">{error}</p>}
    </div>
  );
});

export default Select;
