import React from 'react';
import { Swiper } from 'antd-mobile';
import Cover from './slides/Cover';
import Run365 from './slides/Run365';
import Album from './slides/Album';
import Numbers from './slides/Numbers';
import Hosts from './slides/Hosts';
import Brands from './slides/Brands';
import Contact from './slides/Contact';

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
           <Hosts />
        </Swiper.Item>
        <Swiper.Item>
           <Brands />
        </Swiper.Item>
        <Swiper.Item>
           <Contact />
        </Swiper.Item>
      </Swiper>
    </div>
  );
};

export default Index;
