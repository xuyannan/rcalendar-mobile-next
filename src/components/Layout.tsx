import React, { useState } from 'react';
import { NavBar, Popup, List } from 'antd-mobile';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UnorderedListOutline } from 'antd-mobile-icons';

const Layout: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    switch(location.pathname) {
        case '/': return 'Stages List';
        case '/s1': return 'Stage 1';
        case '/s2': return 'Stage 2';
        case '/s3': return 'Stage 3';
        case '/bind_strava': return 'Bind Strava';
        case '/strava_callback': return 'Strava Callback';
        case '/wx_auth_callback': return 'Wx Auth';
        default: return 'RCalendar';
    }
  }

  const navigateTo = (path: string) => {
    navigate(path);
    setVisible(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar
        right={<UnorderedListOutline fontSize={24} onClick={() => setVisible(true)} />}
        back={location.pathname !== '/' ? 'Back' : null}
        onBack={() => navigate(-1)}
      >
        {getTitle()}
      </NavBar>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
      <Popup
        visible={visible}
        onMaskClick={() => setVisible(false)}
        position='right'
        bodyStyle={{ width: '60vw' }}
      >
        <List header='Navigation'>
           <List.Item onClick={() => navigateTo('/')}>Home</List.Item>
           <List.Item onClick={() => navigateTo('/bind_strava')}>Bind Strava</List.Item>
        </List>
      </Popup>
    </div>
  );
};

export default Layout;
