import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`w-full ${size} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl`}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
