export default function Spinner({ fullScreen = false, label = 'Memuat...' }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm text-slate-600 ${fullScreen ? 'min-h-screen' : 'py-6'}`}
      role="status"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
