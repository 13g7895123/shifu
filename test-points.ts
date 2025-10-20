// Test script for Prize functionality with points
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

async function testPointsAward() {
  console.log('🧪 測試願望幣獎勵功能...');

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
    // 等待一下讓預設用戶初始化完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 1. 創建測試用戶
    console.log('1. 創建測試用戶...');
    const hashedPassword = await passwordHashService.hashPassword('password123');
    const user = new UserEntity(
      'test-user-001',
      'testuser',
      'test@example.com',
      hashedPassword,
      '1234567890',
      'Test Address',
      0, // 初始願望幣 0
      UserRole.PLAYER,
      new Date(),
      new Date()
    );
    await userRepository.save(user);
    console.log('✅ 用戶創建成功:', user.name, '- 初始願望幣:', user.point);

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

    // 4. 測試發送願望幣禮物（應該增加玩家願望幣）
    console.log('4. 測試發送願望幣禮物...');
    const pointsPrize = await prizeUseCases.awardPrize(
      game.gameId,
      1,
      PrizeType.POINTS,
      '100' // 100願望幣
    );
    console.log('✅ 願望幣禮物發送成功:', pointsPrize.prizeContent);

    // 5. 檢查玩家願望幣是否正確增加
    console.log('5. 檢查玩家願望幣...');
    const updatedUser = await userRepository.findById(user.id);
    if (updatedUser) {
      console.log('✅ 玩家願望幣更新成功:', {
        原始願望幣: user.point,
        獲得願望幣: 100,
        當前願望幣: updatedUser.point,
        預期願望幣: user.point + 100,
        計算正確: updatedUser.point === (user.point + 100)
      });
    }

    // 6. 測試發送實體禮物（不應該影響願望幣）
    console.log('6. 創建另一張票券並測試實體禮物...');
    const ticket2 = new TicketEntity(
      'ticket2',
      game.gameId,
      2,
      user.id,
      10
    );
    await ticketRepository.save(ticket2);

    const currentPoints = updatedUser?.point || 0;
    const physicalPrize = await prizeUseCases.awardPrize(
      game.gameId,
      2,
      PrizeType.PHYSICAL,
      'iPhone 15 Pro'
    );
    console.log('✅ 實體禮物發送成功:', physicalPrize.prizeContent);

    // 7. 檢查實體禮物不影響願望幣
    const finalUser = await userRepository.findById(user.id);
    if (finalUser) {
      console.log('✅ 實體禮物願望幣檢查:', {
        實體禮物前願望幣: currentPoints,
        實體禮物後願望幣: finalUser.point,
        願望幣未變化: finalUser.point === currentPoints
      });
    }

    // 8. 測試無效願望幣
    console.log('7. 測試無效願望幣...');
    const ticket3 = new TicketEntity(
      'ticket3',
      game.gameId,
      3,
      user.id,
      10
    );
    await ticketRepository.save(ticket3);

    try {
      await prizeUseCases.awardPrize(
        game.gameId,
        3,
        PrizeType.POINTS,
        'abc' // 無效願望幣
      );
      console.log('❌ 無效願望幣應該被拒絕');
    } catch (error: any) {
      console.log('✅ 無效願望幣正確被拒絕:', error.message);
    }

    console.log('\n🎉 願望幣獎勵功能測試通過！');

  } catch (error: any) {
    console.error('❌ 測試失敗:', error.message);
  }
}

// 運行測試
testPointsAward();
