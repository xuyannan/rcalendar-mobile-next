import {
  Group,
  Box,
  Burger,
  Drawer,
  ScrollArea,
  Divider,
  rem,
  Image,
  Container,
  Button,
  Menu,
  Avatar,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import logo from '/logo-wide-black.png';
import classes from './HeaderMegaMenu.module.css';
import { STORAGE_USER_TOKEN, STORAGE_USER_REFRESH_TOKEN } from '../constants';
import request from '../utils/request';

interface UserInfo {
  id: number;
  nickname: string;
  email: string;
  avatar_url: string;
  openid: string | null;
  has_password: boolean;
}

export function HeaderMegaMenu() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem(STORAGE_USER_TOKEN));

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_USER_TOKEN);
    if (!token) return;
    
    request({ url: '/api/v2/users/me/', method: 'GET' })
      .then((res) => {
        setUser(res as unknown as UserInfo);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_USER_TOKEN);
        localStorage.removeItem(STORAGE_USER_REFRESH_TOKEN);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_USER_TOKEN);
    localStorage.removeItem(STORAGE_USER_REFRESH_TOKEN);
    window.location.href = '/';
  };

  const links: { label: string; href: string }[] = [
    { label: '首页', href: '/' },
    { label: '用户中心', href: '/user' },
  ];

  const isLoggedIn = !!user;

  return (
    <Box className={classes.header}>
      <Container size="xl" h="100%">
        <Group justify="space-between" h="100%">
          <Image src={logo} alt="Logo" h={32} w="auto" />

          <Group h="100%" gap={0} visibleFrom="sm">
            {links.map((link) => (
              <a key={link.label} href={link.href} className={classes.link}>
                {link.label}
              </a>
            ))}
          </Group>

          <Group visibleFrom="sm">
            {loading ? null : isLoggedIn ? (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="xs">
                      <Avatar src={user.avatar_url} size="sm" radius="xl">
                        {user.nickname?.[0] || user.email?.[0] || 'U'}
                      </Avatar>
                      <Text size="sm">{user.nickname || user.email || '用户'}</Text>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component="a" href="/user">
                    用户中心
                  </Menu.Item>
                  <Menu.Item component="a" href="/user/bindDevice">
                    绑定设备
                  </Menu.Item>
                  <Menu.Item component="a" href="/user/account">
                    账户管理
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={handleLogout}>
                    退出登录
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <>
                <Button component="a" href="/login">
                  登录 / 注册
                </Button>
              </>
            )}
          </Group>

          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
        </Group>
      </Container>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="菜单"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />

          {links.map((link) => (
            <a key={link.label} href={link.href} className={classes.link} onClick={closeDrawer}>
              {link.label}
            </a>
          ))}

          <Divider my="sm" />

          <Group justify="center" grow pb="xl" px="md">
            {loading ? null : isLoggedIn ? (
              <Button variant="subtle" onClick={handleLogout}>
                退出登录
              </Button>
            ) : (
              <>
                <Button variant="default" component="a" href="/login">
                  登录
                </Button>
                <Button component="a" href="/register">
                  注册
                </Button>
              </>
            )}
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
