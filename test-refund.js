// 測試退款功能
const { InMemoryUserRepository } = require('./dist/infrastructure/repositories/InMemoryUserRepository');
const { InMemoryGameRepository } = require('./dist/infrastructure/repositories/InMemoryGameRepository');
const { InMemoryTicketRepository } = require('./dist/infrastructure/repositories/InMemoryTicketRepository');
const { InMemoryPrizeRepository } = require('./dist/infrastructure/repositories/InMemoryPrizeRepository');
const { RedisService } = require('./dist/infrastructure/services/RedisService');
const { GameUseCases } = require('./dist/application/usecases/GameUseCases');
const { TicketUseCases } = require('./dist/application/usecases/TicketUseCases');
const { PrizeUseCases } = require('./dist/application/usecases/PrizeUseCases');
const { TicketEntity } = require('./dist/domain/entities/Ticket');
const { PrizeEntity, PrizeType } = require('./dist/domain/entities/Prize');

async function testRefundFunctionality() {
  console.log('🧪 測試退款功能...');

  // 初始化 repositories
  const userRepository = new InMemoryUserRepository();
  const gameRepository = new InMemoryGameRepository(new RedisService());
  const ticketRepository = new InMemoryTicketRepository();
  const prizeRepository = new InMemoryPrizeRepository();
  const redisService = new RedisService();

  // 等待初始化完成
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 初始化 use cases
  const gameUseCases = new GameUseCases(gameRepository, redisService, prizeRepository, userRepository, ticketRepository);
  const ticketUseCases = new TicketUseCases(ticketRepository, userRepository, gameRepository);
  const prizeUseCases = new PrizeUseCases(prizeRepository, ticketRepository, userRepository, gameRepository);

  try {
    // 1. 獲取測試用戶 Alice (使用預設 ID)
    console.log('1. 獲取測試用戶...');
    const alice = await userRepository.findById('default-alice-001');
    if (!alice) {
      throw new Error('找不到測試用戶 Alice');
    }
    console.log(`✅ 用戶 Alice 初始願望幣: ${alice.point}`);

    // 2. 獲取測試遊戲
    console.log('2. 獲取測試遊戲...');
    const game = await gameRepository.findByGameId('game-001');
    if (!game) {
      throw new Error('找不到測試遊戲 game-001');
    }
    console.log(`✅ 找到遊戲: ${game.gameId}`);

    // 3. 為 Alice 購買票券
    console.log('3. 為 Alice 購買票券...');
    const ticketPrice = 50;
    const ticket = new TicketEntity(
      'test-ticket-1',
      'game-001',
      1,
      alice.id,
      ticketPrice
    );
    await ticketRepository.save(ticket);
    
    // 扣除購買金額
    const updatedAlice = alice.updatePoints(-ticketPrice);
    await userRepository.save(updatedAlice);
    console.log(`✅ Alice 購買票券後願望幣: ${updatedAlice.point}`);

    // 4. 發放願望幣獎勵
    console.log('4. 發放願望幣獎勵...');
    const prize = await prizeUseCases.awardPrize('game-001', 1, PrizeType.POINTS, '30');
    console.log(`✅ 發放獎勵: ${prize.prizeContent} 願望幣`);

    // 檢查 Alice 當前願望幣
    const aliceAfterPrize = await userRepository.findById(alice.id);
    console.log(`✅ Alice 獲得獎勵後願望幣: ${aliceAfterPrize.point}`);

    // 5. 取消遊戲（應該退還票券金額並收回獎勵）
    console.log('5. 取消遊戲...');
    const cancelResult = await gameUseCases.cancelGame('game-001');
    if (!cancelResult) {
      throw new Error('取消遊戲失敗');
    }
    console.log('✅ 遊戲已取消');

    // 6. 檢查最終結果
    console.log('6. 檢查最終結果...');
    const finalAlice = await userRepository.findById(alice.id);
    console.log(`✅ Alice 最終願望幣: ${finalAlice.point}`);

    // 檢查票券是否被刪除
    const remainingTickets = await ticketRepository.findByGameId('game-001');
    console.log(`✅ 剩餘票券數量: ${remainingTickets.length}`);

    // 檢查獎勵是否被刪除
    const remainingPrizes = await prizeRepository.findByGameId('game-001');
    console.log(`✅ 剩餘獎勵數量: ${remainingPrizes.length}`);

    // 驗證願望幣計算
    const expectedPoints = alice.point; // 應該回到初始願望幣
    if (finalAlice.point === expectedPoints) {
      console.log('🎉 退款功能測試通過！Alice 的願望幣已正確恢復到初始狀態');
    } else {
      console.error(`❌ 願望幣計算錯誤。期望: ${expectedPoints}, 實際: ${finalAlice.point}`);
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

// 運行測試
testRefundFunctionality();
