export interface MatchSetupData {
  player1Name: string;
  player2Name: string;
  totalSets: number;
  gamesPerSet: number;
}

export type PlayerKey = 'player1' | 'player2';

export interface MatchScoreValue {
  points: { player1: number; player2: number };
  games: { player1: number; player2: number };
  sets: { player1: number; player2: number };
  ended: boolean;
}

export interface MatchSnapshot {
  points: { player1: number; player2: number };
  games: { player1: number; player2: number };
  sets: { player1: number; player2: number };
  ended: boolean;
}

export interface MatchState extends MatchSetupData {
  startedAt: number;
  score: MatchScoreValue;
  history: MatchSnapshot[];
}
