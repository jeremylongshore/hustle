import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LogGamePage from './page';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset().mockImplementation(async (_url, init) => init?.method === 'POST'
    ? { ok: true, json: async () => ({ success: true }) }
    : { ok: true, json: async () => ({ players: [
      { id: 'keeper', name: 'Fixture Keeper', primaryPosition: 'GK' },
      { id: 'defender', name: 'Fixture Defender', primaryPosition: 'CB' },
    ] }) });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function fillBase(athlete: string) {
  const { container } = render(<LogGamePage />);
  await screen.findByText('Fixture Keeper');
  const field = (name: string) => container.querySelector(`[name="${name}"]`)!;
  fireEvent.change(field('athleteId'), { target: { value: athlete } });
  fireEvent.change(field('opponent'), { target: { value: 'Fixture Opponent' } });
  fireEvent.change(field('teamScore'), { target: { value: '3' } });
  fireEvent.change(field('opponentScore'), { target: { value: '0' } });
  return field;
}
async function submit() {
  await act(async () => fireEvent.click(screen.getByRole('button', { name: /save game/i })));
  await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true));
  return JSON.parse(fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')![1].body);
}

it('renders keeper fields from the selected athlete and submits entered statistics', async () => {
  await fillBase('keeper');
  fireEvent.change(screen.getByLabelText('Saves'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Goals Against'), { target: { value: '0' } });
  fireEvent.click(screen.getByLabelText('Clean Sheet'));
  expect(screen.queryByLabelText('Tackles')).toBeNull();
  expect(await submit()).toMatchObject({ saves: 5, goalsAgainst: 0, cleanSheet: true, tackles: 0, result: 'Win', yourScore: 3, opponentScore: 0 });
});

it('preserves defender values and excludes keeper fields', async () => {
  await fillBase('defender');
  fireEvent.change(screen.getByLabelText('Tackles'), { target: { value: '8' } });
  fireEvent.change(screen.getByLabelText('Interceptions'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Clearances'), { target: { value: '12' } });
  expect(screen.queryByLabelText('Saves')).toBeNull();
  expect(await submit()).toMatchObject({ tackles: 8, interceptions: 4, clearances: 12, saves: 0, cleanSheet: false });
});

it('honors an explicit played-position change and does not submit stale hidden stats', async () => {
  const field = await fillBase('keeper');
  fireEvent.change(screen.getByLabelText('Saves'), { target: { value: '5' } });
  fireEvent.change(field('position'), { target: { value: 'CB' } });
  fireEvent.change(screen.getByLabelText('Tackles'), { target: { value: '2' } });
  expect(await submit()).toMatchObject({ saves: 0, cleanSheet: false, tackles: 2 });
});

it('prevents future dates before a request can be submitted', async () => {
  const field = await fillBase('defender');
  fireEvent.change(field('date'), { target: { value: '2999-01-01' } });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: /save game/i })));
  expect(screen.getByText('Game date cannot be in the future')).toBeVisible();
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
});
