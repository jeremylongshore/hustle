import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { signIn } from 'next-auth/react';
import LoginPage from './page';

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

it('recovers the login form when the actual credentials request never finishes', async () => {
  vi.useFakeTimers();
  vi.mocked(signIn).mockImplementation(() => new Promise(() => {}));
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'fixture@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'fixture-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  expect(screen.getByRole('button')).toBeDisabled();
  await act(async () => { await vi.advanceTimersByTimeAsync(15001); });
  expect(screen.getByRole('button')).toBeEnabled();
  expect(screen.getByText(/timed out/i)).toBeVisible();
});

it('recovers the form after a network rejection without exposing internal errors', async () => {
  vi.mocked(signIn).mockRejectedValue(new Error('private transport diagnostics'));
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'fixture@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'fixture-password' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign In' })); });
  expect(screen.getByRole('button')).toBeEnabled();
  expect(screen.getByText('Unable to sign in right now. Please try again.')).toBeVisible();
  expect(screen.queryByText(/private transport/)).toBeNull();
});
