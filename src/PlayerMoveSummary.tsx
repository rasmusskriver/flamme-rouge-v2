import React from "react";
import { Move, Rider } from "./types";

interface PlayerMoveSummaryProps {
  moves: Move[];
  riders: Rider[];
  currentRound: number;
  isPlayer1: boolean;
  onContinue: () => void;
}

export function PlayerMoveSummary({ moves, riders, currentRound, isPlayer1, onContinue }: PlayerMoveSummaryProps) {
  return (
    <div className="mt-4 text-center">
      <h3 className="text-3xl font-bold mb-6 text-slate-200">Dine valg for runde {currentRound}</h3>
      <ul className="space-y-4 max-w-md mx-auto">
        {moves.map(m => {
          const rider = riders.find(r => r.id === m.rider_id);
          return (
            <li key={m.rider_id} className="flex items-center justify-between gap-4 bg-slate-700 p-4 rounded-lg">
              <span className="font-bold text-lg text-white">{rider?.color} {rider?.rider_type}</span>
              <span className="font-mono text-yellow-400 text-xl">{m.selected_card}</span>
            </li>
          );
        })}
      </ul>
      {isPlayer1 && (
        <div className="mt-8">
          <button 
            onClick={onContinue}
            className="w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
          >
            Fortsæt til næste runde
          </button>
        </div>
      )}
    </div>
  );
}