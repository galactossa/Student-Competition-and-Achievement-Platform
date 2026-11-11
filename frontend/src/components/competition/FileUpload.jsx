import { useEffect, useRef, useState } from 'react';
import { FileText, ImagePlus, UploadCloud, X } from 'lucide-react';

const limits = { poster: 2 * 1024 * 1024, guidebook: 10 * 1024 * 1024 };
const accept = {
  poster: ['image/jpeg', 'image/png', 'image/webp'],
  guidebook: ['application/pdf']
};
const acceptLabels = { poster: 'JPG, PNG, WEBP (maks. 2 MB)', guidebook: 'PDF (maks. 10 MB)' };

export default function FileUpload({ name, label, file, onChange, existingUrl }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file || name !== 'poster') {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, name]);

  function choose(candidate) {
    if (!candidate) return;
    if (!accept[name].includes(candidate.type)) {
      setError(name === 'poster' ? 'Pilih file JPG, PNG, atau WEBP.' : 'Pilih file PDF.');
      return;
    }
    if (candidate.size > limits[name]) {
      setError(`Ukuran file maksimal ${name === 'poster' ? '2 MB' : '10 MB'}.`);
      return;
    }
    setError('');
    onChange(candidate);
  }

  const currentFile = file;
  const isImage = name === 'poster';
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {existingUrl && !currentFile && (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          {isImage
            ? <img src={existingUrl} alt="Poster saat ini" className="h-16 w-20 rounded object-cover" />
            : <FileText className="text-rose-600" size={24} />}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{isImage ? 'Poster saat ini' : decodeURIComponent(existingUrl.split('/').pop())}</p>
            <a className="text-xs text-indigo-600 hover:underline" href={existingUrl} target="_blank" rel="noreferrer">Lihat file</a>
          </div>
        </div>
      )}
      <button
        type="button"
        className={`flex min-h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'} ${error ? 'border-rose-400' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          choose(event.dataTransfer.files[0]);
        }}
      >
        {currentFile && isImage
          ? <img src={previewUrl} alt="Pratinjau poster" className="mb-2 max-h-28 rounded object-contain" />
          : currentFile
            ? <FileText className="mb-2 text-rose-600" size={26} />
            : isImage
              ? <ImagePlus className="mb-2 text-slate-400" size={24} />
              : <UploadCloud className="mb-2 text-slate-400" size={24} />}
        <span className="text-sm font-medium text-slate-700">{currentFile?.name || 'Tarik file ke sini atau klik untuk memilih'}</span>
        <span className="mt-1 text-xs text-slate-500">{acceptLabels[name]}{existingUrl && !currentFile ? ' · file baru akan mengganti file lama' : ''}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={name === 'poster' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'}
        className="sr-only"
        onChange={(event) => {
          choose(event.target.files[0]);
          event.target.value = '';
        }}
      />
      {currentFile && <button type="button" className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline" onClick={() => onChange(null)}><X size={14} /> Hapus pilihan</button>}
      {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
    </div>
  );
}
