import React from 'react';

const Numbers: React.FC = () => {
  const stats = [
    { value: '540+', label: 'Episodes' },
    { value: '55,000+', label: 'Subscribers' },
    { value: '6,000,000+', label: 'Plays' },
    { value: '10,000+', label: 'Average plays for each episode' },
    { value: '200+', label: 'Average comments for each episode' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', background: '#fff' }}>
      {stats.map((item, index) => (
        <div key={index} style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 48, fontWeight: 'bold', color: '#444', lineHeight: 1.2 }}>{item.value}</div>
          <div style={{ fontSize: 18, color: '#666', marginTop: 4 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default Numbers;
