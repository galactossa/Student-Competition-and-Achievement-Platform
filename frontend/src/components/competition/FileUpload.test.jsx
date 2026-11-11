import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileUpload from './FileUpload';

describe('FileUpload', () => {
  it('rejects an oversized poster before passing it to the form', () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload name="poster" label="Poster" file={null} onChange={onChange} />);
    const input = container.querySelector('input[type="file"]');
    const oversized = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'poster.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByRole('alert')).toHaveTextContent('Ukuran file maksimal 2 MB.');
    expect(onChange).not.toHaveBeenCalled();
  });
});
