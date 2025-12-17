import React from 'react';
import { Grid } from 'antd-mobile';
import run365Img from '../../assets/podcasts/run365.png';
import gearTalkImg from '../../assets/podcasts/gearTalk.png';
import pbPlanImg from '../../assets/podcasts/pbPlan.jpg';
import first100Img from '../../assets/podcasts/first100.png';

const Album: React.FC = () => {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff', padding: '40px 20px' }}>
      <Grid columns={2} gap={20}>
        <Grid.Item>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={run365Img} alt="Run365" style={{ width: '100%', maxWidth: 120, objectFit: 'contain' }} />
            </div>
        </Grid.Item>
        <Grid.Item>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={gearTalkImg} alt="Gear Talk" style={{ width: '100%', maxWidth: 120, objectFit: 'contain' }} />
            </div>
        </Grid.Item>
        <Grid.Item>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={pbPlanImg} alt="PB Plan" style={{ width: '100%', maxWidth: 120, objectFit: 'contain' }} />
            </div>
        </Grid.Item>
        <Grid.Item>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={first100Img} alt="First 100" style={{ width: '100%', maxWidth: 120, objectFit: 'contain' }} />
            </div>
        </Grid.Item>
      </Grid>

      <div style={{ marginTop: 40, color: '#333', fontSize: 14, lineHeight: 1.6, textAlign: 'justify' }}>
        <p style={{ marginBottom: 20 }}>
          《跑者日历》（Run365）是一档专注于跑步、马拉松、越野跑以及健康生活方式的播客。拥有超过300期节目，它已经发展成为一个拥有丰富主题的多元化“播客宇宙”。
        </p>
        <p style={{ marginBottom: 20 }}>
          目前的播客矩阵包含多档定期更新的节目，包括《跑者日历》（Run365）、《装备说》（Gear Talk）、《PB计划》（The PB Project）以及《首百计划》（The First 100K）。
        </p>
        <p style={{ marginBottom: 20 }}>
          不同的节目面向跑步圈内不同的群体，并尝试多样化的形式。例如，《跑者日历》是关于跑者日常生活的每周闲聊，而《PB计划》则是一档为初学者和追求新个人纪录的跑者打造的音频纪录片式训练系列节目。
        </p>
        <p>
          每周至少更新三期新节目，我们在不同时间连接不同类型的听众——确保每一阶段的跑者都能从中获得有价值的内容。
        </p>
      </div>
    </div>
  );
};

export default Album;
