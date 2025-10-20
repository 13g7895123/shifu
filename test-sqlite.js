// Test script for SQLite functionality
import { SqliteService } from './src/infrastructure/services/SqliteService';

async function testSQLite() {
  console.log('🧪 測試SQLite連接...');
  
  try {
    // 測試SQLite導入
    console.log('1️⃣ 測試SQLite3模組導入...');
    const sqlite3 = require('sqlite3');
    console.log('✅ SQLite3模組導入成功');
    console.log('SQLite3版本:', sqlite3.VERSION);
    
    // 測試SqliteService
    console.log('2️⃣ 測試SqliteService初始化...');
    const sqliteService = SqliteService.getInstance();
    
    console.log('3️⃣ 測試數據庫連接...');
    await sqliteService.connect();
    console.log('✅ SQLite數據庫連接成功');
    
    // 測試基本操作
    console.log('4️⃣ 測試基本SQL操作...');
    const result = await sqliteService.get('SELECT sqlite_version() as version');
    console.log('✅ SQLite版本:', result?.version);
    
    // 測試表創建
    console.log('5️⃣ 測試表創建...');
    await sqliteService.run('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
    console.log('✅ 測試表創建成功');
    
    // 清理
    await sqliteService.disconnect();
    console.log('✅ SQLite測試完成，所有功能正常');
    
  } catch (error) {
    console.error('❌ SQLite測試失敗:');
    console.error('錯誤類型:', error.constructor.name);
    console.error('錯誤訊息:', error.message);
    
    if (error.message.includes('Exec format error')) {
      console.error('\n💡 解決方案:');
      console.error('1. 在Docker容器中重新編譯SQLite3:');
      console.error('   docker exec -it luckygo-api-dev npm rebuild sqlite3');
      console.error('2. 或者重建Docker映像:');
      console.error('   docker-compose -f docker-compose.dev.yml build --no-cache');
      console.error('3. 或者使用memory模式:');
      console.error('   設置 REPOSITORY_TYPE=memory');
    }
    
    process.exit(1);
  }
}

// 運行測試
testSQLite();
