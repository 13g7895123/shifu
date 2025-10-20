// 創建出貨管理測試數據
const API_BASE = 'http://localhost:3001/api';

async function createShippingTestData() {
  try {
    // 登入獲取管理員 token
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@luckygo.com',
        password: 'Admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('登入失敗: ' + loginData.message);
    }

    const token = loginData.data?.token || loginData.token;
    console.log('✅ 管理員登入成功');

    // 獲取現有遊戲ID - 簡化版
    const gameId = 'test-game-001'; // 使用固定的測試遊戲ID
    console.log('✅ 使用測試遊戲ID:', gameId);

    // 獲取 Alice 的用戶ID
    const usersResponse = await fetch(`${API_BASE}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const usersData = await usersResponse.json();
    const alice = usersData.data?.users?.find(u => u.name === 'Alice') || 
                  usersData.users?.find(u => u.name === 'Alice');
    
    if (!alice) {
      throw new Error('找不到 Alice 用戶');
    }

    console.log('✅ 找到 Alice 用戶:', alice.id);

    // 創建測試獎勵數據 - 直接在 InMemory 數據庫中模擬
    const testPrizes = [
      { playerId: alice.id, ticketNumber: 1, content: '限量版T恤', gameId: 'test-game-001' },
      { playerId: alice.id, ticketNumber: 2, content: '精美馬克杯', gameId: 'test-game-001' },
      { playerId: alice.id, ticketNumber: 3, content: '紀念徽章', gameId: 'test-game-001' },
      { playerId: alice.id, ticketNumber: 4, content: '限量海報', gameId: 'test-game-001' },
      { playerId: alice.id, ticketNumber: 5, content: '遊戲周邊', gameId: 'test-game-001' }
    ];

    console.log('開始創建獎勵...');

    for (const prize of testPrizes) {
      try {
        // 直接調用獎勵API
        const awardResponse = await fetch(`${API_BASE}/prizes/award`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            gameId: prize.gameId,
            ticketNumber: prize.ticketNumber,
            prizeType: 'physical',
            prizeContent: prize.content
          })
        });

        const awardData = await awardResponse.json();
        if (awardData.success) {
          console.log(`✅ 獎勵創建成功: ${prize.content}`);
        } else {
          console.log(`❌ 獎勵創建失敗: ${prize.content} - ${awardData.message}`);
        }
      } catch (error) {
        console.log(`❌ 處理獎勵失敗: ${prize.content} - ${error.message}`);
      }
    }

    console.log('\n🎉 測試數據創建完成！');
    console.log('📦 現在可以在管理員控制台測試出貨管理功能了');
    console.log('🔗 前端頁面: http://localhost:3000/admin/shipping');
    console.log('👤 使用管理員帳號登入 (email: admin@luckygo.com, password: Admin123)');

  } catch (error) {
    console.error('❌ 測試數據創建失敗:', error.message);
  }
}

// 檢查是否在 Node.js 環境中運行
if (typeof window === 'undefined') {
  createShippingTestData();
}
