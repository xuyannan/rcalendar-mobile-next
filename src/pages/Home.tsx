import React from 'react';
import { List } from 'antd-mobile';

const Home: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Stages list</h1>
      <List header='Menu'>
      </List>
    </div>
  );
};

export default Home;
