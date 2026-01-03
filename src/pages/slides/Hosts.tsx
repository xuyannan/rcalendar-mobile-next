import React from 'react';
import janice from '../../assets/hosts/janice.png';
import nanzi from '../../assets/hosts/nanzi.png';
import yangbo from '../../assets/hosts/yangbo.png';

const Hosts: React.FC = () => {
  const hosts = [
    {
      name: '佳凝',
      avatar: janice,
      intro: '体育行业资深从业者，马拉松爱好者，完成超过50场马拉松和越野赛，五星大满贯跑者，拥有丰富的海外参赛经验。',
    },
    {
      name: '南子',
      avatar: nanzi,
      intro: '计算机前端开发技术专家，连续创业者，马拉松、越野跑和户外运动爱好者。',
    },
    {
      name: '杨波',
      avatar: yangbo,
      intro: '装备达人，多个知名跑鞋品牌资深测试跑者，全马PB 2小时48分，越野赛多次登上领奖台。',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', background: '#fff' }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' }}>主播</div>
      {hosts.map((host, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <img
            src={host.avatar}
            alt={host.name}
            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginRight: 16 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>{host.name}</div>
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>{host.intro}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Hosts;
