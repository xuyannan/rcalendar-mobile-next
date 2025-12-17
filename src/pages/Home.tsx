import React from 'react';
import { List } from 'antd-mobile';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Stages list</h1>
      <List header='Menu'>
        <List.Item>
            <Link to="/bind_strava">bind_strava</Link>
        </List.Item>
      </List>
    </div>
  );
};

export default Home;
