import React from 'react';

const Contact: React.FC = () => {
  const contacts = [
    { label: '商务合作微信号', value: 'janicegooner' },
    { label: '客服及加入听众群微信号', value: 'paozherili' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', background: '#fff', position: 'relative' }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 24 }}>联系我们</div>
      {contacts.map((item, index) => (
        <div key={index} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 18, color: '#333', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            {item.value}
          </div>
        </div>
      ))}
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#999' }}>
        备案号:京ICP备20004918号 | <a href="/privacy" style={{ color: '#999' }}>隐私政策</a>
      </div>
    </div>
  );
};

export default Contact;
