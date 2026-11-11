import { useId } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const levels = ['Internal Kampus', 'Regional', 'Nasional', 'Internasional'];
const modes = ['online', 'offline', 'hybrid'];

function RadioOption({ name, value, checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4 accent-indigo-600" />
      {children}
    </label>
  );
}

export default function PublicFilter({ filters, categories = [], onChange, onReset }) {
  const id = useId();
  const selectedMode = filters.mode || '';

  return (
    <Card className="h-fit space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Filter</h2>
        <button type="button" onClick={onReset} className="text-sm font-medium text-indigo-600 hover:underline">Reset</button>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Level</legend>
        <RadioOption name={`${id}-level`} value="" checked={!filters.level} onChange={() => onChange('level', '')}>Semua level</RadioOption>
        {levels.map((level) => <RadioOption key={level} name={`${id}-level`} value={level} checked={filters.level === level} onChange={() => onChange('level', level)}>{level}</RadioOption>)}
      </fieldset>

      <div>
        <label htmlFor={`${id}-category`} className="mb-2 block text-sm font-semibold text-slate-800">Kategori</label>
        <select id={`${id}-category`} value={filters.category_id || ''} onChange={(event) => onChange('category_id', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">Semua kategori</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Mode</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!selectedMode} onChange={() => onChange('mode', '')} className="h-4 w-4 accent-indigo-600" />
          Semua mode
        </label>
        {modes.map((mode) => (
          <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm capitalize text-slate-700">
            <input type="checkbox" checked={selectedMode === mode} onChange={() => onChange('mode', selectedMode === mode ? '' : mode)} className="h-4 w-4 accent-indigo-600" />
            {mode}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Harga</legend>
        <RadioOption name={`${id}-price`} value="" checked={filters.is_free === ''} onChange={() => onChange('is_free', '')}>Semua</RadioOption>
        <RadioOption name={`${id}-price`} value="true" checked={filters.is_free === 'true'} onChange={() => onChange('is_free', 'true')}>Gratis</RadioOption>
        <RadioOption name={`${id}-price`} value="false" checked={filters.is_free === 'false'} onChange={() => onChange('is_free', 'false')}>Berbayar</RadioOption>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-slate-800">Deadline pendaftaran</legend>
        <RadioOption name={`${id}-deadline`} value="" checked={!filters.deadline} onChange={() => onChange('deadline', '')}>Semua</RadioOption>
        <RadioOption name={`${id}-deadline`} value="7" checked={filters.deadline === '7'} onChange={() => onChange('deadline', '7')}>Kurang dari 7 hari</RadioOption>
        <RadioOption name={`${id}-deadline`} value="30" checked={filters.deadline === '30'} onChange={() => onChange('deadline', '30')}>Kurang dari 30 hari</RadioOption>
      </fieldset>

      <Button type="button" variant="ghost" className="w-full" onClick={onReset}>Reset Filter</Button>
    </Card>
  );
}
