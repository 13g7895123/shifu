// Test script for SQLite repositories
import dotenv from 'dotenv';
import { RepositoryFactory } from './src/infrastructure/services/RepositoryFactory';
import { RedisService } from './src/infrastructure/services/RedisService';
import { UserEntity, UserRole } from './src/domain/entities/User';
import { GameEntity } from './src/domain/entities/Game';
import { TicketEntity } from './src/domain/entities/Ticket';
import { PrizeEntity, PrizeType, PrizeStatus } from './src/domain/entities/Prize';
import { ChatMessageEntity } from './src/domain/entities/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function testSqliteRepositories() {
  console.log('🔄 開始測試 SQLite Repositories...\n');

  try {
    // 初始化 Redis 服務
    const redisService = new RedisService();
    
    // 初始化 Repository Factory 為 SQLite 模式
    await RepositoryFactory.initialize('sqlite', redisService);
    
    // 獲取所有 repositories
    const userRepository = RepositoryFactory.getUserRepository();
    const gameRepository = RepositoryFactory.getGameRepository();
    const ticketRepository = RepositoryFactory.getTicketRepository();
    const prizeRepository = RepositoryFactory.getPrizeRepository();
    const chatRepository = RepositoryFactory.getChatRepository();
    
    console.log('✅ Repository Factory 初始化完成\n');

    // === 測試 User Repository ===
    console.log('📋 測試 User Repository...');
    
    // 查找預設用戶
    const alice = await userRepository.findByEmail('alice@gmail.com');
    console.log('預設用戶 Alice:', alice ? `${alice.name} (${alice.email})` : '未找到');
    
    const admin = await userRepository.findByEmail('admin@gmail.com');
    console.log('預設管理員:', admin ? `${admin.name} (${admin.email})` : '未找到');
    
    // 創建新用戶
    const newUser = new UserEntity(
      uuidv4(),
      'Test User',
      'test@example.com',
      'hashed_password',
      '0987654321',
      '測試地址',
      200,
      UserRole.PLAYER,
      new Date(),
      new Date()
    );
    
    await userRepository.save(newUser);
    console.log('✅ 新用戶已保存:', newUser.name);
    
    const foundUser = await userRepository.findById(newUser.id);
    console.log('🔍 查找新用戶:', foundUser ? foundUser.name : '未找到');
    
    // === 測試 Game Repository ===
    console.log('\n📋 測試 Game Repository...');
    
    const allGames = await gameRepository.findAll();
    console.log(`遊戲總數: ${allGames.length}`);
    
    if (allGames.length > 0) {
      console.log('第一個遊戲:', allGames[0].gameId, '-', allGames[0].spec.name || '未命名遊戲');
    }
    
    // === 測試 Ticket Repository ===
    console.log('\n📋 測試 Ticket Repository...');
    
    if (allGames.length > 0 && alice) {
      const testTicket = new TicketEntity(
        uuidv4(),
        allGames[0].gameId,
        1001,
        alice.id,
        10,
        new Date()
      );
      
      await ticketRepository.save(testTicket);
      console.log('✅ 測試票券已保存');
      
      const userTickets = await ticketRepository.findByUserId(alice.id);
      console.log(`用戶 ${alice.name} 的票券數量: ${userTickets.length}`);
    }
    
    // === 測試 Prize Repository ===
    console.log('\n📋 測試 Prize Repository...');
    
    const allPrizes = await prizeRepository.findAll();
    console.log(`獎品總數: ${allPrizes.length}`);
    
    if (alice) {
      const userPrizes = await prizeRepository.findByPlayerId(alice.id);
      console.log(`用戶 ${alice.name} 的獎品數量: ${userPrizes.length}`);
      
      if (userPrizes.length > 0) {
        console.log('第一個獎品:', userPrizes[0].prizeContent, '-', userPrizes[0].status);
      }
    }
    
    // === 測試 Chat Repository ===
    console.log('\n📋 測試 Chat Repository...');
    
    if (alice) {
      const testMessage = ChatMessageEntity.create(
        alice.id,
        alice.name,
        '這是一條測試訊息',
        'normal'
      );
      
      await chatRepository.saveMessage(testMessage);
      console.log('✅ 測試聊天訊息已保存');
      
      const recentMessages = await chatRepository.getRecentMessages(5);
      console.log(`最近聊天訊息數量: ${recentMessages.length}`);
      
      if (recentMessages.length > 0) {
        console.log('最新訊息:', recentMessages[recentMessages.length - 1].message);
      }
    }
    
    console.log('\n✅ 所有 SQLite Repository 測試完成！');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  } finally {
    // 清理資源
    await RepositoryFactory.cleanup();
    console.log('🧹 資源已清理');
  }
}

// 執行測試
testSqliteRepositories().catch(console.error);
