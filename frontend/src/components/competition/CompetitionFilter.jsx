import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

export default function CompetitionFilter({ filters, categories, onChange, onReset }) {
  return (
    <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="Filter kompetisi">
      <Input aria-label="Cari kompetisi" placeholder="Cari nama/penyelenggara..." value={filters.q} onChange={(event) => onChange('q', event.target.value)} />
      <Select aria-label="Kategori" value={filters.category_id} onChange={(event) => onChange('category_id', event.target.value)}>
        <option value="">Semua kategori</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </Select>
      <Select aria-label="Level" value={filters.level} onChange={(event) => onChange('level', event.target.value)}>
        <option value="">Semua level</option>
        {['Internal Kampus', 'Regional', 'Nasional', 'Internasional'].map((level) => <option key={level}>{level}</option>)}
      </Select>
      <Select aria-label="Mode" value={filters.mode} onChange={(event) => onChange('mode', event.target.value)}>
        <option value="">Semua mode</option>
        {['online', 'offline', 'hybrid'].map((mode) => <option key={mode}>{mode}</option>)}
      </Select>
      <Select aria-label="Status" value={filters.status} onChange={(event) => onChange('status', event.target.value)}>
        <option value="">Semua status</option>
        {['draft', 'published', 'registration_open', 'registration_closed', 'submission', 'competition', 'result_announced', 'completed'].map((status) => <option key={status}>{status}</option>)}
      </Select>
      <Button variant="secondary" onClick={onReset}>Reset filter</Button>
    </section>
  );
}
