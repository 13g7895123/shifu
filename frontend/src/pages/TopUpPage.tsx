import React, { useState } from 'react';

const TopUpPage: React.FC = () => {
  const [selectedPayment, setSelectedPayment] = useState<'ipass' | 'jkopay'>('ipass');

  const handlePaymentChange = (payment: 'ipass' | 'jkopay') => {
    setSelectedPayment(payment);
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">
                <i className="bi bi-credit-card me-2"></i>
                儲值中心
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                {/* 左側：支付方式選擇 */}
                <div className="col-12">
                  <h5 className="mb-3">選擇支付方式</h5>
                  
                  {/* Tab 標籤 */}
                  <ul className="nav nav-tabs" id="paymentTabs" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${selectedPayment === 'ipass' ? 'active' : ''}`}
                        id="ipass-tab"
                        type="button"
                        role="tab"
                        aria-controls="ipass"
                        aria-selected={selectedPayment === 'ipass'}
                        onClick={() => handlePaymentChange('ipass')}
                      >
                        <i className="bi bi-credit-card me-1"></i>
                        iPass Money
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${selectedPayment === 'jkopay' ? 'active' : ''}`}
                        id="jkopay-tab"
                        type="button"
                        role="tab"
                        aria-controls="jkopay"
                        aria-selected={selectedPayment === 'jkopay'}
                        onClick={() => handlePaymentChange('jkopay')}
                      >
                        <i className="bi bi-wallet2 me-1"></i>
                        街口支付
                      </button>
                    </li>
                  </ul>

  
                </div>

                {/* 右側：QR Code */}
                <div className="col-12">                  
                  <div className="text-center">
                    <div className="card">
                      <div className="card-body">
           
                        
                        <div className="qr-code-container my-3">
                          <img
                            src={selectedPayment === 'ipass' ? '/pics/ipassmoney.jfif' : '/pics/jkopay.jfif'}
                            alt={`${selectedPayment === 'ipass' ? 'iPass Money' : '街口支付'} QR Code`}
                            className="img-fluid"
                            style={{ maxWidth: '90vw', maxHeight: '60vh', objectFit: 'contain' }}
                          />
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="alert alert-info">
                    <h6>
                      <i className="bi bi-info-circle me-2"></i>
                      儲值注意事項
                    </h6>
                    <ul className="mb-0 small">
                      <li>轉帳儲值時請在備註欄填寫會員Email</li>
                      <li>如遇付款問題，請聯繫客服中心</li>
                    </ul>
                  </div>
                </div>
              </div>

    
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpPage;
