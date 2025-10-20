# 開發環境熱重載測試

## 測試步驟

1. **啟動開發環境**：
   ```bash
   .\docker-scripts.bat dev:up
   ```

2. **查看日誌**：
   ```bash
   .\docker-scripts.bat dev:logs
   ```

3. **測試熱重載**：
   - 修改 `src/infrastructure/web/server.ts` 文件
   - 觀察容器日誌中的重啟信息
   - 確認新的輸出出現在日誌中

4. **停止開發環境**：
   ```bash
   .\docker-scripts.bat dev:down
   ```

## 已設置的功能

✅ **代碼掛載**: 整個項目目錄掛載到容器的 `/app` 目錄
✅ **熱重載**: 使用 `ts-node-dev --respawn` 監聽文件變化並自動重啟
✅ **調試支持**: 開放 9229 端口用於 Node.js 調試
✅ **環境變量**: 設置 `CHOKIDAR_USEPOLLING=true` 確保在 Docker 中文件監聽正常
✅ **優雅關閉**: 服務重啟時正確關閉 Redis 連接
✅ **權限處理**: 使用非 root 用戶運行容器

## 驗證結果

- ✅ 文件修改檢測正常
- ✅ 服務自動重啟功能正常
- ✅ Redis 連接在重啟時正確處理
- ✅ 新的日誌輸出顯示熱重載成功
