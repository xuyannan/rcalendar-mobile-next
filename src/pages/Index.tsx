import React from 'react';
import { Swiper } from 'antd-mobile';
import Cover from './slides/Cover';
import Run365 from './slides/Run365';
import Album from './slides/Album';
import Numbers from './slides/Numbers';

const Index: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Swiper direction='vertical' style={{ '--height': '100vh' }} indicatorProps={{ color: 'white' }}>
        <Swiper.Item>
           <Cover />
        </Swiper.Item>
        <Swiper.Item>
           <Album />
        </Swiper.Item>
        <Swiper.Item>
           <Numbers />
        </Swiper.Item>
        <Swiper.Item>
           <Run365 />
        </Swiper.Item>
      </Swiper>
    </div>
  );
};

export default Index;
