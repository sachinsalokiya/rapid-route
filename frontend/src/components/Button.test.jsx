import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

describe('UI primitives', () => {
  it('renders Badge text', () => {
    render(<Badge>In Transit</Badge>);
    expect(screen.getByText('In Transit')).toBeInTheDocument();
  });

  it('renders Button', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders EmptyState', () => {
    render(
      <MemoryRouter>
        <EmptyState title="No data" description="Nothing here" />
      </MemoryRouter>
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
