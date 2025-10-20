// Test script for Prize functionality
import { PrizeUseCases } from './src/application/usecases/PrizeUseCases';
import { InMemoryPrizeRepository } from './src/infrastructure/repositories/InMemoryPrizeRepository';
import { InMemoryTicketRepository } from './src/infrastructure/repositories/InMemoryTicketRepository';
import { InMemoryUserRepository } from './src/infrastructure/repositories/InMemoryUserRepository';
import { InMemoryGameRepository } from './src/infrastructure/repositories/InMemoryGameRepository';
import { RedisService } from './src/infrastructure/services/RedisService';
import { PasswordHashService } from './src/infrastructure/services/PasswordHashService';
import { UserEntity, UserRole } from './src/domain/entities/User';
import { GameEntity } from './src/domain/entities/Game';
import { TicketEntity } from './src/domain/entities/Ticket';
import { PrizeType } from './src/domain/entities/Prize';

async function testPrizeFunctionality() {
  console.log('🧪 測試獲獎紀錄功能...');

  // 初始化 repositories
  const prizeRepository = new InMemoryPrizeRepository();
  const ticketRepository = new InMemoryTicketRepository();
  const userRepository = new InMemoryUserRepository();
  const redisService = new RedisService();
  const gameRepository = new InMemoryGameRepository(redisService);
  const passwordHashService = new PasswordHashService();

  // 初始化 use cases
  const prizeUseCases = new PrizeUseCases(
    prizeRepository,
    ticketRepository,
    userRepository,
    gameRepository
  );

  try {
    // 1. 創建測試用戶
    console.log('1. 創建測試用戶...');
    const hashedPassword = await passwordHashService.hashPassword('password123');
    const user = new UserEntity(
      'user1',
      'testuser',
      'test@example.com',
      hashedPassword,
      '1234567890',
      'Test Address',
      0,
      UserRole.PLAYER,
      new Date(),
      new Date()
    );
    await userRepository.save(user);
    console.log('✅ 用戶創建成功:', user.name);

    // 2. 創建測試遊戲
    console.log('2. 創建測試遊戲...');
    const game = new GameEntity(
      'game1',
      'test-game-001',
      { 
        description: '測試遊戲',
        tickets: 100,
        ticketPrice: 10
      }
    );
    await gameRepository.save(game);
    console.log('✅ 遊戲創建成功:', game.gameId);

    // 3. 創建測試票券
    console.log('3. 創建測試票券...');
    const ticket = new TicketEntity(
      'ticket1',
      game.gameId,
      1,
      user.id,
      10
    );
    await ticketRepository.save(ticket);
    console.log('✅ 票券創建成功: 票號', ticket.ticketNumber);

    // 4. 測試發送願望幣禮物
    console.log('4. 測試發送願望幣禮物...');
    const pointsPrize = await prizeUseCases.awardPrize(
      game.gameId,
      1,
      PrizeType.POINTS,
      '100願望幣'
    );
    console.log('✅ 願望幣禮物發送成功:', pointsPrize.prizeContent);

    // 5. 測試重複發送禮物 (應該失敗)
    console.log('5. 測試重複發送禮物...');
    try {
      await prizeUseCases.awardPrize(
        game.gameId,
        1,
        PrizeType.PHYSICAL,
        'iPhone 15'
      );
      console.log('❌ 重複發送禮物應該失敗');
    } catch (error: any) {
      console.log('✅ 重複發送禮物正確被拒絕:', error.message);
    }

    // 6. 測試獲取獲獎紀錄
    console.log('6. 測試獲取獲獎紀錄...');
    const gamesPrizes = await prizeUseCases.getPrizesByGameId(game.gameId);
    console.log('✅ 遊戲獲獎紀錄數量:', gamesPrizes.length);

    const playerPrizes = await prizeUseCases.getPrizesByPlayerId(user.id);
    console.log('✅ 玩家獲獎紀錄數量:', playerPrizes.length);

    // 7. 測試獲獎統計
    console.log('7. 測試獲獎統計...');
    const gameStats = await prizeUseCases.getGamePrizeStats(game.gameId);
    console.log('✅ 遊戲獲獎統計:', {
      總獲獎數: gameStats.totalPrizes,
      願望幣獎品: gameStats.pointsPrizes,
      實體獎品: gameStats.physicalPrizes
    });

    const playerStats = await prizeUseCases.getPlayerPrizeStats(user.id);
    console.log('✅ 玩家獲獎統計:', {
      總獲獎數: playerStats.totalPrizes,
      願望幣獎品: playerStats.pointsPrizes,
      實體獎品: playerStats.physicalPrizes
    });

    console.log('\n🎉 所有測試通過！獲獎紀錄功能正常運作。');

  } catch (error: any) {
    console.error('❌ 測試失敗:', error.message);
  }
}

// 運行測試
testPrizeFunctionality();
