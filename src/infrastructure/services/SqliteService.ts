// Infrastructure Service - SQLite Database Service
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export class SqliteService {
  private static instance: SqliteService;
  private db: sqlite3.Database | null = null;
  private readonly dbPath: string;

  private constructor() {
    console.log('🔄 初始化 SQLite 服務...');
    // 創建數據庫目錄
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = path.join(dbDir, 'luckygo.db');
    console.log(`SQLite 數據庫路徑: ${this.dbPath}`);
  }

  public static getInstance(): SqliteService {
    if (!SqliteService.instance) {
      SqliteService.instance = new SqliteService();
    }
    return SqliteService.instance;
  }

  public async connect(): Promise<void> {
    
    console.log('🔄 連接 SQLite 數據庫...');
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite 連接失敗:', err.message);
          reject(err);
        } else {
          console.log('✅ SQLite 數據庫已連接');
          this.initializeTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  public async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ SQLite 關閉失敗:', err.message);
            reject(err);
          } else {
            console.log('✅ SQLite 數據庫已關閉');
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('數據庫未連接，請先調用 connect()');
    }
    return this.db;
  }

  public async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('數據庫未連接'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('數據庫未連接'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('數據庫未連接'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  private async initializeTables(): Promise<void> {
    const tables = [
      // Users 表
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        point INTEGER DEFAULT 100,
        role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Games 表
      `CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        game_id TEXT UNIQUE NOT NULL,
        spec TEXT NOT NULL, -- JSON string
        finish_time DATETIME,
        canceled INTEGER DEFAULT 0, -- SQLite uses INTEGER for boolean
        purchasing_stopped INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tickets 表
      `CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        ticket_number INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        purchase_price INTEGER NOT NULL,
        purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, ticket_number),
        FOREIGN KEY (game_id) REFERENCES games(game_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      // Prizes 表
      `CREATE TABLE IF NOT EXISTS prizes (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        ticket_number INTEGER NOT NULL,
        prize_type TEXT NOT NULL CHECK (prize_type IN ('points', 'physical')),
        prize_content TEXT NOT NULL,
        status TEXT DEFAULT 'pending_shipment' CHECK (status IN ('pending_shipment', 'shipment_notified', 'shipped')),
        awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(game_id),
        FOREIGN KEY (player_id) REFERENCES users(id)
      )`,

      // Chat Messages 表
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'normal' CHECK (type IN ('normal', 'system', 'admin')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    ];

    for (const sql of tables) {
      try {
        await this.run(sql);
      } catch (error) {
        console.error('❌ 創建表失敗:', error);
        throw error;
      }
    }

    console.log('✅ SQLite 表初始化完成');
  }
}
