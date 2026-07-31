import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '../components/Common/StatusBadge';

describe('StatusBadge Component Infrastructure', () => {
  it('renders status badge correctly for role', () => {
    render(<StatusBadge status="SUPER_ADMIN" type="role" />);
    expect(screen.getByText(/SUPER_ADMIN/i)).toBeInTheDocument();
  });

  it('renders status badge correctly for constraint type', () => {
    render(<StatusBadge status="VACATION" type="constraint" />);
    expect(screen.getByText(/VACATION/i)).toBeInTheDocument();
  });

  it('renders status badge correctly for schedule status', () => {
    render(<StatusBadge status="PUBLISHED" type="schedule" />);
    expect(screen.getByText(/PUBLISHED/i)).toBeInTheDocument();
  });
});
