import { GameEntity, GameStatus } from '../entities/Game';

export interface GameRepository {
  findById(id: string): Promise<GameEntity | null>;
  findByGameId(gameId: string): Promise<GameEntity | null>;
  findAll(): Promise<GameEntity[]>;
  findByStatus(status: GameStatus): Promise<GameEntity[]>;
  save(game: GameEntity): Promise<GameEntity>;
  update(id: string, game: Partial<GameEntity>): Promise<GameEntity | null>;
  delete(id: string): Promise<boolean>;
  create(gameData: {
    gameId?: string;
    spec?: Record<string, any>;
  }): Promise<GameEntity>;
}
