#!/usr/bin/env node

/**
 * Repository Switcher Script
 * 用於切換應用程式的 repository 類型
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function writeEnvFile(filePath, env) {
  const lines = [];
  
  // 保留註釋和空行的結構
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf-8');
    const exampleLines = exampleContent.split('\n');
    
    exampleLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        lines.push(line);
      } else {
        const [key] = line.split('=');
        if (key && env.hasOwnProperty(key.trim())) {
          lines.push(`${key.trim()}=${env[key.trim()]}`);
        } else {
          lines.push(line);
        }
      }
    });
  } else {
    // 如果沒有範例文件，直接寫入
    Object.entries(env).forEach(([key, value]) => {
      lines.push(`${key}=${value}`);
    });
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
}

function switchRepository(type) {
  if (!['memory', 'sqlite'].includes(type)) {
    console.error('❌ 無效的 repository 類型。支援的類型: memory, sqlite');
    process.exit(1);
  }
  
  console.log(`🔄 切換 repository 類型到: ${type.toUpperCase()}`);
  
  // 如果 .env 不存在，從 .env.example 複製
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('📝 已從 .env.example 創建 .env 文件');
  }
  
  // 讀取現有的環境變數
  const env = readEnvFile(envPath);
  
  // 更新 REPOSITORY_TYPE
  env.REPOSITORY_TYPE = type;
  
  // 寫回 .env 文件
  writeEnvFile(envPath, env);
  
  console.log(`✅ Repository 類型已更新為: ${type.toUpperCase()}`);
  console.log('💡 提示:');
  console.log('  - memory: 數據存儲在內存中，重啟後消失');
  console.log('  - sqlite: 數據持久化存儲在 ./data/luckygo.db 文件中');
  console.log('');
  console.log('🔄 請重啟應用程式以使更改生效');
}

function showStatus() {
  const env = readEnvFile(envPath);
  const currentType = env.REPOSITORY_TYPE || 'memory';
  
  console.log('📊 當前 Repository 配置:');
  console.log(`   類型: ${currentType.toUpperCase()}`);
  
  if (currentType === 'sqlite') {
    const dbPath = path.join(__dirname, 'data', 'luckygo.db');
    const exists = fs.existsSync(dbPath);
    console.log(`   SQLite 數據庫: ${exists ? '✅ 存在' : '❌ 不存在'}`);
    if (exists) {
      const stats = fs.statSync(dbPath);
      console.log(`   數據庫大小: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   最後修改: ${stats.mtime.toLocaleString()}`);
    }
  }
}

function showHelp() {
  console.log('Repository Switcher - 數據庫類型切換工具\n');
  console.log('用法:');
  console.log('  node switch-repository.js <command> [arguments]\n');
  console.log('命令:');
  console.log('  memory    切換到內存數據庫');
  console.log('  sqlite    切換到 SQLite 數據庫');
  console.log('  status    顯示當前配置');
  console.log('  help      顯示此幫助信息\n');
  console.log('範例:');
  console.log('  node switch-repository.js sqlite   # 切換到 SQLite');
  console.log('  node switch-repository.js memory   # 切換到內存數據庫');
  console.log('  node switch-repository.js status   # 查看當前狀態');
}

// 主程式
const command = process.argv[2];

switch (command) {
  case 'memory':
    switchRepository('memory');
    break;
  case 'sqlite':
    switchRepository('sqlite');
    break;
  case 'status':
    showStatus();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      console.error(`❌ 未知命令: ${command}`);
    }
    showHelp();
    process.exit(1);
}
