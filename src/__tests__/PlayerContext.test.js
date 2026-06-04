import React, { useContext } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { PlayerProvider, PlayerContext } from '../../src/context/PlayerContext.jsx';

// Helper component to expose context values for testing
const TestConsumer = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    changeAccentColor,
    accentColor,
    toggleMute,
    volume,
    setVolume
  } = useContext(PlayerContext);

  return (
    <div>
      <div data-testid="currentTrack">{currentTrack ? currentTrack.title : 'null'}</div>
      <div data-testid="isPlaying">{isPlaying ? 'true' : 'false'}</div>
      <div data-testid="accentColor">{accentColor}</div>
      <div data-testid="volume">{volume}</div>
      <button onClick={togglePlay} data-testid="togglePlayBtn">Toggle Play</button>
      <button onClick={() => changeAccentColor('#ff0000')} data-testid="changeAccentBtn">Change Accent</button>
      <button onClick={toggleMute} data-testid="toggleMuteBtn">Toggle Mute</button>
      <button onClick={() => setVolume(0.5)} data-testid="setVolumeBtn">Set Volume 0.5</button>
    </div>
  );
};

describe('PlayerContext', () => {
  test('provides correct initial values', () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );
    expect(screen.getByTestId('currentTrack')).toHaveTextContent('null');
    expect(screen.getByTestId('isPlaying')).toHaveTextContent('false');
    expect(screen.getByTestId('accentColor')).toHaveTextContent('#818cf8');
    expect(screen.getByTestId('volume')).toHaveTextContent('1');
  });

  test('togglePlay does nothing when no track is loaded', () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );
    fireEvent.click(screen.getByTestId('togglePlayBtn'));
    expect(screen.getByTestId('isPlaying')).toHaveTextContent('false');
  });

  test('changeAccentColor updates CSS variables', () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );
    fireEvent.click(screen.getByTestId('changeAccentBtn'));
    expect(screen.getByTestId('accentColor')).toHaveTextContent('#ff0000');
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--accent-primary')).toBe('#ff0000');
  });

  test('toggleMute toggles volume between 0 and previous value', () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );
    fireEvent.click(screen.getByTestId('toggleMuteBtn'));
    expect(screen.getByTestId('volume')).toHaveTextContent('0');
    fireEvent.click(screen.getByTestId('toggleMuteBtn'));
    expect(screen.getByTestId('volume')).toHaveTextContent('1');
  });

  test('setVolume updates volume state', () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );
    fireEvent.click(screen.getByTestId('setVolumeBtn'));
    expect(screen.getByTestId('volume')).toHaveTextContent('0.5');
  });
});
