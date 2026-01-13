
import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from './types';
import { LEVEL_CONFIGS } from './constants';
import GameCanvas from './components/GameCanvas';
import { audioEngine } from './services/AudioEngine';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(10);

  const startGame = () => {
    audioEngine.init();
    audioEngine.resume();
    setGameState(GameState.PLAYING);
    setLevel(1);
    const config = LEVEL_CONFIGS[0];
    setTimeLeft(config.timer);
  };

  const nextLevel = () => {
    if (level >= 5) {
      setGameState(GameState.VICTORY);
      audioEngine.stopAllBuzzers();
    } else {
      const nextLvl = level + 1;
      setLevel(nextLvl);
      setGameState(GameState.PLAYING);
      setTimeLeft(LEVEL_CONFIGS[nextLvl - 1].timer);
    }
  };

  const gameOver = () => {
    setGameState(GameState.GAME_OVER);
    audioEngine.stopAllBuzzers();
  };

  useEffect(() => {
    let timer: number;
    if (gameState === GameState.PLAYING && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === GameState.PLAYING) {
      gameOver();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  return (
    <div className="relative w-full h-full bg-black text-white font-serif overflow-hidden select-none">
      
      {/* Game Canvas */}
      <GameCanvas 
        level={level} 
        gameState={gameState} 
        onLevelClear={() => setGameState(GameState.LEVEL_CLEAR)} 
        onGameOver={gameOver}
      />

      {/* Gameplay HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-6xl font-black text-red-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] italic tracking-tighter">
          {timeLeft}s
        </div>
      )}

      {/* Level Info */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-8 left-8 text-2xl font-black uppercase text-zinc-900/50">
          Level {level}
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 p-6 text-center">
          <h1 className="text-8xl font-black mb-4 uppercase tracking-tighter italic text-red-600 drop-shadow-[0_4px_4px_rgba(255,0,0,0.5)]">
            Fly Squasher
          </h1>
          <p className="text-2xl mb-12 text-zinc-400 max-w-lg font-sans font-bold">
            CLEANSE THE INFESTATION. <br/>
            BRIGHT. VISCERAL. DEADLY.
          </p>
          <button 
            onClick={startGame}
            className="px-16 py-6 bg-red-600 hover:bg-red-500 text-3xl font-black uppercase transition-all transform hover:scale-110 active:scale-95 border-b-8 border-red-800 text-white"
          >
            SQUASH
          </button>
        </div>
      )}

      {/* Level Clear Screen */}
      {gameState === GameState.LEVEL_CLEAR && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-50 p-6 text-center animate-in fade-in duration-500">
          <h2 className="text-6xl font-black mb-4 uppercase tracking-tighter text-lime-400">
            CLEARED!
          </h2>
          <p className="text-zinc-400 text-xl mb-12 uppercase tracking-widest font-bold">The table is clean... for now.</p>
          <button 
            onClick={nextLevel}
            className="px-16 py-6 bg-lime-600 hover:bg-lime-500 text-3xl font-black uppercase transition-all transform hover:scale-110 active:scale-95 border-b-8 border-lime-800 text-white"
          >
            NEXT ROOM
          </button>
        </div>
      )}

      {/* Game Over / Victory Screens */}
      {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 z-50 p-6 text-center">
          <h2 className="text-8xl font-black mb-4 uppercase tracking-tighter">
            {gameState === GameState.VICTORY ? 'VICTORY' : 'FAILED'}
          </h2>
          <p className="text-2xl mb-12 text-zinc-200 font-bold uppercase">
            {gameState === GameState.VICTORY 
              ? 'YOU ARE THE MASTER SQUASHER.' 
              : 'THE MAGGOTS HAVE WON.'}
          </p>
          <button 
            onClick={startGame}
            className="px-16 py-6 bg-black hover:bg-zinc-900 text-3xl font-black uppercase transition-all transform hover:scale-110 active:scale-95 border-b-8 border-zinc-800"
          >
            RETRY
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
