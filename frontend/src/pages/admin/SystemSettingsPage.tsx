import React, { useState, useEffect } from 'react';
import { systemSettingsAPI, LiveStreamSettings } from '../../services/systemSettingsService';

const SystemSettingsPage: React.FC = () => {
  const [liveStreamSettings, setLiveStreamSettings] = useState<LiveStreamSettings>({
    url: '',
    isEnabled: false,
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 載入直播設定
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await systemSettingsAPI.getLiveStreamSettings();
      setLiveStreamSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入設定失敗');
    } finally {
      setLoading(false);
    }
  };

  // 儲存直播設定
  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // 驗證URL格式
      if (liveStreamSettings.url) {
        try {
          new URL(liveStreamSettings.url);
        } catch {
          setError('請輸入有效的URL');
          return;
        }
      }

      await systemSettingsAPI.setLiveStreamSettings(liveStreamSettings);
      setSuccess('設定儲存成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存設定失敗');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="container-lg">
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lg">
      <div className="my-4">
        {/* 頁面標題 */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center">
            <span className="display-4 me-3">⚙️</span>
            <h1 className="text-primary mb-0">系統設定</h1>
          </div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/admin" className="text-decoration-none">管理員面板</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                系統設定
              </li>
            </ol>
          </nav>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {success}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess(null)}
            ></button>
          </div>
        )}

        {/* 直播設定卡片 */}
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="card-title mb-0">
              <i className="bi bi-broadcast me-2"></i>
              直播設定
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
              {/* 啟用直播開關 */}
              <div className="mb-4">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="liveStreamEnabled"
                    checked={liveStreamSettings.isEnabled}
                    onChange={(e) => setLiveStreamSettings(prev => ({
                      ...prev,
                      isEnabled: e.target.checked
                    }))}
                  />
                  <label className="form-check-label fw-bold" htmlFor="liveStreamEnabled">
                    啟用直播功能
                  </label>
                </div>
                <small className="text-muted">
                  開啟後，遊戲頁面將顯示直播內容
                </small>
              </div>

              {/* 直播URL */}
              <div className="mb-4">
                <label htmlFor="liveStreamUrl" className="form-label fw-bold">
                  直播URL <span className="text-danger">*</span>
                </label>
                <input
                  type="url"
                  className="form-control"
                  id="liveStreamUrl"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  value={liveStreamSettings.url}
                  onChange={(e) => setLiveStreamSettings(prev => ({
                    ...prev,
                    url: e.target.value
                  }))}
                  required
                />
                <div className="form-text">
                  請輸入嵌入式影片URL（如YouTube embed連結）
                </div>
              </div>

 

              {/* 预览区域 */}
              {liveStreamSettings.url && (
                <div className="mb-4">
                  <label className="form-label fw-bold">預覽</label>
                  <div className="border rounded p-3 bg-light">
                    <div style={{ aspectRatio: '16/9', maxWidth: '400px' }}>
                      <iframe
                        src={liveStreamSettings.url}
                        className="w-100 h-100"
                        style={{ border: 'none' }}
                        title="預覽"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按鍵 */}
              <div className="d-flex gap-2">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving || !liveStreamSettings.url}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">儲存中...</span>
                      </span>
                      儲存中
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      儲存設定
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={loadSettings}
                  disabled={saving}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  重新載入
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="card mt-4">
          <div className="card-header">
            <h6 className="card-title mb-0">
              <i className="bi bi-info-circle me-2"></i>
              使用說明
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="fw-bold">YouTube影片</h6>
                <p className="text-muted small mb-3">
                  1. 開啟YouTube影片頁面<br/>
                  2. 點擊「分享」 → 「嵌入」<br/>
                  3. 複製iframe的src連結<br/>
                  例如: https://www.youtube.com/embed/VIDEO_ID
                </p>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold">其他影片平台</h6>
                <p className="text-muted small mb-3">
                  確保提供的URL支援iframe嵌入，<br/>
                  並且遵循CORS政策。<br/>
                  建議使用HTTPS協定的URL。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
