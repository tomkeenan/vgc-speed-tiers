import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CelebrationDialog } from './CelebrationDialog';
import type { Celebration } from './celebration';
import { renderWithTheme } from '../test/renderWithTheme';

const celebration = (over: Partial<Celebration>): Celebration => ({
  streak: 12,
  personalBest: true,
  rank: null,
  board: null,
  ...over,
});

describe('CelebrationDialog', () => {
  it('is closed when there is nothing to celebrate', () => {
    renderWithTheme(<CelebrationDialog celebration={null} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Continue playing' })).toBeNull();
  });

  it('shows the practice copy and only Continue playing for a local best', () => {
    renderWithTheme(<CelebrationDialog celebration={celebration({ streak: 8 })} onClose={() => {}} />);
    expect(screen.getByText('New PB!')).toBeTruthy();
    expect(screen.getByText('A streak of 8 beats your record. Ready to make it count in Ranked?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue playing' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'View leaderboard' })).toBeNull();
  });

  it('shows the ranked copy for a best that did not reach the top ten', () => {
    renderWithTheme(
      <CelebrationDialog celebration={celebration({ streak: 8, board: 'faster:hard' })} onClose={() => {}} />,
    );
    expect(screen.getByText('New PB!')).toBeTruthy();
    expect(screen.getByText('A streak of 8 and climbing. The top 10 is calling.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View leaderboard' })).toBeTruthy();
  });

  it('crowns the champion for first place', () => {
    renderWithTheme(
      <CelebrationDialog celebration={celebration({ streak: 30, rank: 1, board: 'faster:hard' })} onClose={() => {}} />,
    );
    expect(screen.getByText('You are the champion!')).toBeTruthy();
    expect(
      screen.getByText("A streak of 30 tops the leaderboard. You're the very best, like no one ever was!"),
    ).toBeTruthy();
  });

  it('shows the silver copy for second place', () => {
    renderWithTheme(
      <CelebrationDialog celebration={celebration({ streak: 25, rank: 2, board: 'faster:hard' })} onClose={() => {}} />,
    );
    expect(screen.getByText('Almost the best!')).toBeTruthy();
    expect(screen.getByText('A streak of 25 lands you silver. So close you can taste it.')).toBeTruthy();
  });

  it('shows the podium copy for third place', () => {
    renderWithTheme(
      <CelebrationDialog celebration={celebration({ streak: 22, rank: 3, board: 'faster:hard' })} onClose={() => {}} />,
    );
    expect(screen.getByText('On the podium!')).toBeTruthy();
    expect(screen.getByText("A streak of 22 puts you 3rd. The view's even better one step up.")).toBeTruthy();
  });

  it('shows the board copy and opens the run’s board for a top-ten place', () => {
    const onViewLeaderboard = vi.fn();
    const onClose = vi.fn();
    renderWithTheme(
      <CelebrationDialog
        celebration={celebration({ streak: 20, rank: 4, board: 'faster:hard' })}
        onClose={onClose}
        onViewLeaderboard={onViewLeaderboard}
      />,
    );
    expect(screen.getByText('You made the board!')).toBeTruthy();
    expect(screen.getByText("A streak of 20 puts you at #4. The podium's in sight.")).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'View leaderboard' }));
    expect(onViewLeaderboard).toHaveBeenCalledWith('faster:hard');
    expect(onClose).toHaveBeenCalled();
  });

  it('continues playing without opening the leaderboard from the secondary link', () => {
    const onViewLeaderboard = vi.fn();
    const onClose = vi.fn();
    renderWithTheme(
      <CelebrationDialog
        celebration={celebration({ streak: 20, rank: 5, board: 'howfast:standard' })}
        onClose={onClose}
        onViewLeaderboard={onViewLeaderboard}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue playing' }));
    expect(onClose).toHaveBeenCalled();
    expect(onViewLeaderboard).not.toHaveBeenCalled();
  });
});
