import React, { useEffect } from 'react';
import ChatRoom from '../components/ChatRoom';

const CustomerServicePage: React.FC = () => {

    useEffect(() => {
        // 動態載入 LINE 按鈕 script
        const script = document.createElement('script');
        script.src = 'https://www.line-website.com/social-plugins/js/thirdparty/loader.min.js';
        script.async = true;
        script.defer = true;
        
        // 當 script 載入完成後初始化 LINE 按鈕
        script.onload = () => {
            // 給一點時間讓 LINE SDK 初始化
            setTimeout(() => {
                const lineIt = (window as any).LineIt;
                if (lineIt && lineIt.loadButton) {
                    lineIt.loadButton();
                }
            }, 100);
        };
        
        document.head.appendChild(script);

        // 清理函數，在組件卸載時移除 script
        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);
    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white text-center">
                            <h2 className="mb-0">
                                <i className="bi bi-headset me-2"></i>
                                客服中心
                            </h2>
                        </div>
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <p className="lead text-muted">
                                    有任何問題嗎？我們隨時為您提供協助！
                                </p>
                            </div>

                            {/* LINE 客服 */}
                            <div className="mb-5">
                                <h5 className="mb-3 text-center">
                                    <i className="bi bi-chat-dots me-2 text-success"></i>
                                    LINE 線上客服
                                </h5>

                                {/* QR Code 和按鈕區域 */}
                                <div className="text-center">
                                    {/* QR Code */}
                                    <div className="mb-4">
                                        <div className="bg-light p-3 rounded border d-inline-block">
                                            <img
                                                src="https://qr-official.line.me/gs/M_719wpqsl_GW.png?oat_content=qr"
                                                alt="LINE 客服 QR Code"
                                                className="img-fluid"
                                                style={{ maxWidth: '150px', height: 'auto' }}
                                            />
                                            <p className="mt-2 mb-0 text-muted small">
                                                掃描 QR Code 加入好友
                                            </p>
                                        </div>
                                    </div>


                                    {/* LINE 按鈕 */}
                                    <div className="mb-3">
                                        <div 
                                            className="line-it-button" 
                                            data-lang="zh_Hant" 
                                            data-type="friend" 
                                            data-env="PROD" 
                                            data-lineid="@719wpqsl"
                                            data-color="default"
                                            data-size="large"
                                            data-count="false"
                                            data-ver="3"
                                        ></div>
                                        <p className="text-muted small mt-2">
                                            點擊按鈕直接加入 LINE 好友
                                        </p>
                                    </div>

                                </div>

                                <div className="text-center mt-3">
                                    <p className="text-success small mb-0">
                                        <i className="bi bi-clock me-1"></i>
                                        即時客服支援，快速解決您的問題
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 全域聊天室 */}
            <ChatRoom className="chat-room--customer-service" />
        </div>
    );
};

export default CustomerServicePage;
