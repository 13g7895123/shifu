export enum GameStatus {
  PENDING = 'pending',    // 待開始
  ACTIVE = 'active',      // 進行中
  FINISHED = 'finished',  // 已結束
  CANCELLED = 'cancelled' // 已取消
}

export interface Game {
  id: string;
  gameId: string;
  spec: Record<string, any>; // JSON格式的遊戲規格
  finishTime?: Date; // 完成時間
  canceled: boolean; // 是否已取消
  purchasingStopped: boolean; // 是否停止購買
  createdAt: Date;
  updatedAt: Date;
}

export class GameEntity implements Game {
  constructor(
    public id: string,
    public gameId: string,
    public spec: Record<string, any> = {},
    public finishTime: Date | undefined = undefined,
    public canceled: boolean = false,
    public purchasingStopped: boolean = false,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public updateSpec(newSpec: Record<string, any>): GameEntity {
    return new GameEntity(
      this.id,
      this.gameId,
      { ...this.spec, ...newSpec },
      this.finishTime,
      this.canceled,
      this.purchasingStopped,
      this.createdAt,
      new Date()
    );
  }

  public updateFinishTime(finishTime: Date): GameEntity {
    return new GameEntity(
      this.id,
      this.gameId,
      this.spec,
      finishTime,
      this.canceled,
      this.purchasingStopped,
      this.createdAt,
      new Date()
    );
  }

  public updateCanceled(canceled: boolean): GameEntity {
    return new GameEntity(
      this.id,
      this.gameId,
      this.spec,
      this.finishTime,
      canceled,
      this.purchasingStopped,
      this.createdAt,
      new Date()
    );
  }

  public updatePurchasingStopped(purchasingStopped: boolean): GameEntity {
    return new GameEntity(
      this.id,
      this.gameId,
      this.spec,
      this.finishTime,
      this.canceled,
      purchasingStopped,
      this.createdAt,
      new Date()
    );
  }

  public toJSON(): Game {
    return {
      id: this.id,
      gameId: this.gameId,
      spec: this.spec,
      finishTime: this.finishTime,
      canceled: this.canceled,
      purchasingStopped: this.purchasingStopped,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
