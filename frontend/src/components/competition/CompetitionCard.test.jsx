import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CompetitionCard from './CompetitionCard';

const competition = {
  id: 1,
  name: 'Kompetisi Informatika',
  slug: 'kompetisi-informatika',
  organizer: 'SCAP',
  level: 'Nasional',
  price: 0,
  poster_url: '/uploads/competitions/missing-poster.png'
};

function renderCard(item = competition) {
  return render(
    <MemoryRouter>
      <CompetitionCard competition={item} />
    </MemoryRouter>
  );
}

describe('CompetitionCard poster fallback', () => {
  it('renders a placeholder when no poster URL exists', () => {
    renderCard({ ...competition, poster_url: null });
    expect(screen.getByRole('img', { name: 'Poster tidak tersedia' })).toBeInTheDocument();
  });

  it('replaces a failed poster with the placeholder', () => {
    renderCard();
    fireEvent.error(screen.getByRole('img', { name: 'Poster Kompetisi Informatika' }));
    expect(screen.getByRole('img', { name: 'Poster tidak tersedia' })).toBeInTheDocument();
  });
});
