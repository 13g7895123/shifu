// 測試創建不同狀態的獎品數據
// 使用後端API直接添加測試數據

const API_BASE = 'http://localhost:3001/api';

async function createTestPrizes() {
  try {
    // 登入獲取管理員 token
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Administrator',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('登入失敗');
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    console.log('✅ 管理員登入成功');

    // 創建遊戲
    const gameResponse = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        gameName: '背包測試遊戲',
        gameDescription: '用於測試背包頁面的遊戲',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-12-31T23:59:59Z',
        totalTickets: 100,
        ticketPrice: 50
      })
    });

    const gameData = await gameResponse.json();
    const gameId = gameData.data.gameId;
    console.log('✅ 遊戲創建成功:', gameId);

    // 為Alice購買票券（使用Alice的用戶ID）
    const aliceId = 'default-alice-001';
    
    const ticketResponse = await fetch(`${API_BASE}/tickets/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        gameId: gameId,
        userId: aliceId,
        quantity: 5
      })
    });

    console.log('✅ 票券購買成功');

    // 發放不同狀態的獎品
    const prizes = [
      { ticketNumber: 1, content: '限量版T恤' },
      { ticketNumber: 2, content: '精美馬克杯' },
      { ticketNumber: 3, content: '紀念徽章' },
      { ticketNumber: 4, content: '限量海報' },
      { ticketNumber: 5, content: '遊戲周邊' }
    ];

    for (const prize of prizes) {
      await fetch(`${API_BASE}/prizes/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameId: gameId,
          ticketNumber: prize.ticketNumber,
          prizeType: 'physical',
          prizeContent: prize.content
        })
      });
    }

    console.log('✅ 獎品發放完成');

    // 獲取所有獎品並更新狀態
    const allPrizesResponse = await fetch(`${API_BASE}/prizes/player/${aliceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const allPrizesData = await allPrizesResponse.json();
    const allPrizes = allPrizesData.data;

    // 更新獎品狀態
    if (allPrizes.length >= 5) {
      // 第2個改為已通知出貨
      await fetch(`${API_BASE}/prizes/${allPrizes[1].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'shipment_notified'
        })
      });

      // 第3個改為已出貨
      await fetch(`${API_BASE}/prizes/${allPrizes[2].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'shipped'
        })
      });

      // 第4個改為已通知出貨
      await fetch(`${API_BASE}/prizes/${allPrizes[3].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'shipment_notified'
        })
      });

      // 第5個改為已出貨
      await fetch(`${API_BASE}/prizes/${allPrizes[4].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'shipped'
        })
      });

      console.log('✅ 獎品狀態更新完成');
    }

    // 最終檢查
    const finalPrizesResponse = await fetch(`${API_BASE}/prizes/player/${aliceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const finalPrizesData = await finalPrizesResponse.json();
    const finalPrizes = finalPrizesData.data;

    console.log('\n📦 Alice的獎品清單:');
    finalPrizes.forEach((prize, index) => {
      console.log(`${index + 1}. ${prize.prizeContent} - 狀態: ${prize.status} - 票號: #${prize.ticketNumber}`);
    });

    console.log('\n🎉 測試數據創建完成！現在可以在前端測試篩選功能了。');
    console.log(`🔗 前端頁面: http://localhost:3000/my-prizes`);
    console.log(`👤 使用 Alice 帳號登入 (username: Alice, password: alice123)`);

  } catch (error) {
    console.error('❌ 測試數據創建失敗:', error);
  }
}

createTestPrizes();
