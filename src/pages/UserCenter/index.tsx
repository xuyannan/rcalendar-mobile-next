import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Text, Group, Avatar } from '@mantine/core';
import { IconDeviceWatch, IconUserCircle, IconRun } from '@tabler/icons-react';
import classes from './UserCenter.module.css';
import { STORAGE_USER_TOKEN, STORAGE_USER_REFRESH_TOKEN } from '../../constants';
import request from '../../utils/request';
import type { UserInfo } from '../../types/user';
import { HeaderMegaMenu } from '../../components/HeaderMegaMenu';

const navItems = [
  { link: '/user/bindDevice', label: '绑定设备', icon: IconDeviceWatch },
  { link: '/user/workouts', label: '运动记录', icon: IconRun },
  { link: '/user/account', label: '账户管理', icon: IconUserCircle },
];

export default function UserCenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const isMiniProgram = new URLSearchParams(window.location.search).get('from') === 'miniprogram';

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_USER_TOKEN);
    if (!token) {
      if (isMiniProgram) {
        setAuthError(true);
        setLoading(false);
        return;
      }
      navigate('/login?redirect_to=' + encodeURIComponent(location.pathname));
      return;
    }

    request({ url: '/api/v2/users/me/', method: 'GET' })
      .then((res) => {
        setUser(res as unknown as UserInfo);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_USER_TOKEN);
        localStorage.removeItem(STORAGE_USER_REFRESH_TOKEN);
        if (isMiniProgram) {
          setAuthError(true);
        } else {
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, location.pathname, isMiniProgram]);

  if (loading) {
    return (
      <>
        {!isMiniProgram && <HeaderMegaMenu />}
        <Box p="xl">加载中...</Box>
      </>
    );
  }

  if (authError) {
    return (
      <Box p="xl" style={{ textAlign: 'center', paddingTop: 60 }}>
        <Text c="dimmed">登录状态已失效，请返回小程序重新进入</Text>
      </Box>
    );
  }

  if (isMiniProgram) {
    return <Outlet context={{ user, setUser }} />;
  }

  const links = navItems.map((item) => (
    <a
      className={classes.link}
      data-active={location.pathname === item.link || undefined}
      href={item.link}
      key={item.label}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </a>
  ));

  return (
    <>
      <HeaderMegaMenu />
      <Box className={classes.userLayout}>
        <nav className={classes.navbar}>
          {user && (
            <Group mb="md">
              <Avatar src={user.avatar_url} size="md" radius="xl">
                {user.nickname?.[0] || user.email?.[0] || 'U'}
              </Avatar>
              <div>
                <Text fw={500} size="sm">{user.nickname || '用户'}</Text>
                <Text c="dimmed" size="xs">{user.email || ''}</Text>
              </div>
            </Group>
          )}
          <div className={classes.navbarMain}>
            {links}
          </div>
        </nav>

        <main className={classes.content}>
          <Outlet context={{ user, setUser }} />
        </main>
      </Box>
    </>
  );
}
