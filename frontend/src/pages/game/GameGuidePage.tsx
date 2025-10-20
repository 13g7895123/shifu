import React from 'react';

const GameGuidePage: React.FC = () => {
  return (
    <div className="container-lg">
      <div className="my-4">
        <h1 className="h3 mb-4">遊戲指南</h1>
        <div className="card">
          <div className="card-body">
            <p className="text-muted">🎯 遊戲規則</p>
            <h5 className="card-title mb-3">遊戲規則詳情</h5>
            <ol className="list-group list-group-flush">
              <li className="list-group-item">
                <h6 className="fw-bold text-primary">1. 註冊會員</h6>
                <p className="mb-1">
                  您需要先在遊戲頁面完成會員註冊，才能參加願望靶場抽獎活動。
                </p>
              </li>
              <li className="list-group-item">
                <h6 className="fw-bold text-primary">2. 購買幸運號碼</h6>
                <p className="mb-1">
                  玩家可使用「願望幣」購買 1–100 號的任意號碼。
                  <span className="text-success fw-bold">買越多，中獎機會越高！</span>
                </p>
                <p className="small text-muted mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  每一輪的《籤號價格》將依該輪大獎的市價來決定，因此不同場次價格可能會不同。
                </p>
              </li>
              <li className="list-group-item">
                <h6 className="fw-bold text-primary">3. 公平開獎</h6>
                <p className="mb-1">
                  開獎全程由現場主持人或特別來賓親手射鏢，射中轉盤上的號碼即為中獎號碼。
                </p>
                <p className="small text-muted mb-0">
                  <i className="bi bi-shield-check me-1"></i>
                  完全人工隨機，保證公平透明，絕無程式操控。
                </p>
              </li>
              <li className="list-group-item">
                <h6 className="fw-bold text-primary">4. 獎勵規則</h6>
                <p className="mb-1">
                  一共射出 5 支鏢：
                </p>
                <ul>
                  <li>前 4 支鏢：小獎（願望幣願望幣）</li>
                  <li>第 5 支鏢：決定該輪大獎（實體獎品運費一律貨到自付）</li>
                  </ul>
              </li>
              <li className="list-group-item">
                <h6 className="fw-bold text-primary">5. 大獎許願機制</h6>
                <p className="mb-1">
                  每場直播前，玩家可至粉絲專頁「許願」想要的大獎項目，當天直播的大獎將由所有會員許願投票結果決定！
                </p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameGuidePage;
