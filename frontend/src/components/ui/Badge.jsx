const roleLabels = {
  super_admin: 'Super Admin',
  admin_pka: 'Admin PKA',
  mahasiswa: 'Mahasiswa',
  verifier: 'Verifikator',
  pimpinan: 'Pimpinan',
  prodi: 'Program Studi'
};

export default function Badge({ variant = 'default', children, role }) {
  const content = role ? roleLabels[role] || role : children;
  const colors = variant === 'success'
    ? 'bg-emerald-100 text-emerald-800'
    : variant === 'warning'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-indigo-100 text-indigo-800';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>{content}</span>;
}
