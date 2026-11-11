import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CompetitionTable from './CompetitionTable';

describe('CompetitionTable', () => {
  it('renders competition information and calls delete action', () => {
    const onDelete = vi.fn();
    const competition = {
      id: 7,
      name: 'Hackathon SCAP',
      organizer: 'SCAP',
      category: { name: 'Teknologi' },
      level: 'Nasional',
      status: 'draft',
      registration_deadline: '2027-01-01T10:00:00Z'
    };
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CompetitionTable competitions={[competition]} onDelete={onDelete} />
      </MemoryRouter>
    );
    expect(screen.getAllByText('Hackathon SCAP')).toHaveLength(2);
    expect(screen.getByText('Teknologi')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Hapus Hackathon SCAP' })[0]);
    expect(onDelete).toHaveBeenCalledWith(competition);
  });
});
