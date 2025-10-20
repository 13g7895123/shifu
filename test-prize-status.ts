import { PrizeUseCases } from './src/application/usecases/PrizeUseCases';
import { UserUseCases } from './src/application/usecases/UserUseCases';
import { GameUseCases } from './src/application/usecases/GameUseCases';
import { InMemoryPrizeRepository } from './src/infrastructure/repositories/InMemoryPrizeRepository';
import { InMemoryUserRepository } from './src/infrastructure/repositories/InMemoryUserRepository';
import { InMemoryGameRepository } from './src/infrastructure/repositories/InMemoryGameRepository';
import { InMemoryTicketRepository } from './src/infrastructure/repositories/InMemoryTicketRepository';
import { PrizeType, PrizeStatus } from './src/domain/entities/Prize';
import { UserEntity, Role } from './src/domain/entities/User';
import { GameEntity, GameStatus } from './src/domain/entities/Game';
import { TicketEntity } from './src/domain/entities/Ticket';

async function createTestData() {
  // 創建存儲庫
  const prizeRepository = new InMemoryPrizeRepository();
  const userRepository = new InMemoryUserRepository();
  const gameRepository = new InMemoryGameRepository();
  const ticketRepository = new InMemoryTicketRepository();

  // 創建用例
  const prizeUseCases = new PrizeUseCases(prizeRepository, ticketRepository, userRepository, gameRepository);
  const userUseCases = new UserUseCases(userRepository);
  const gameUseCases = new GameUseCases(gameRepository);

  // 創建測試用戶
  const testUser = new UserEntity(
    'test-user-123',
    'TestPlayer',
    'test@example.com',
    'hashedpassword',
    Role.PLAYER,
    1000
  );
  await userRepository.create(testUser);

  // 創建測試遊戲
  const testGame = new GameEntity(
    'game-123',
    '測試遊戲',
    '這是一個測試遊戲',
    new Date('2024-01-01'),
    new Date('2024-12-31'),
    GameStatus.ACTIVE,
    100,
    50
  );
  await gameRepository.create(testGame);

  // 創建測試票券
  for (let i = 1; i <= 5; i++) {
    const ticket = new TicketEntity(
      `ticket-${i}`,
      'game-123',
      'test-user-123',
      i,
      50,
      new Date()
    );
    await ticketRepository.create(ticket);
  }

  // 創建不同狀態的獎品
  await prizeUseCases.awardPrize('game-123', 1, PrizeType.PHYSICAL, '限量版T恤');
  await prizeUseCases.awardPrize('game-123', 2, PrizeType.PHYSICAL, '精美馬克杯');
  await prizeUseCases.awardPrize('game-123', 3, PrizeType.PHYSICAL, '紀念徽章');
  await prizeUseCases.awardPrize('game-123', 4, PrizeType.PHYSICAL, '限量海報');
  await prizeUseCases.awardPrize('game-123', 5, PrizeType.PHYSICAL, '遊戲周邊');

  // 獲取所有獎品並更新狀態
  const allPrizes = await prizeRepository.findByPlayerId('test-user-123');
  
  // 更新不同獎品的狀態
  if (allPrizes.length >= 5) {
    // 第一個保持 pending_shipment (未出貨)
    
    // 第二個改為 shipment_notified (已通知出貨)
    await prizeRepository.update(allPrizes[1].id, { status: PrizeStatus.SHIPMENT_NOTIFIED });
    
    // 第三個改為 shipped (已出貨)
    await prizeRepository.update(allPrizes[2].id, { status: PrizeStatus.SHIPPED });
    
    // 第四個改為 shipment_notified (已通知出貨)
    await prizeRepository.update(allPrizes[3].id, { status: PrizeStatus.SHIPMENT_NOTIFIED });
    
    // 第五個改為 shipped (已出貨)
    await prizeRepository.update(allPrizes[4].id, { status: PrizeStatus.SHIPPED });
  }

  console.log('✅ 測試數據創建完成！');
  console.log('用戶 ID:', 'test-user-123');
  console.log('遊戲 ID:', 'game-123');
  
  // 顯示創建的獎品
  const finalPrizes = await prizeUseCases.getPrizesByPlayerId('test-user-123');
  console.log('\n獎品列表:');
  finalPrizes.forEach((prize, index) => {
    console.log(`${index + 1}. ${prize.prizeContent} - 狀態: ${prize.status} - 票號: #${prize.ticketNumber}`);
  });
}

createTestData().catch(console.error);
