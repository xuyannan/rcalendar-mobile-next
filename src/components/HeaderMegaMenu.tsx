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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import logo from '/logo-wide-black.png';
import classes from './HeaderMegaMenu.module.css';

export function HeaderMegaMenu() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  const links = [
    { label: '首页', href: '/' },
    { label: '绑定设备', href: '/home' },
  ];

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
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
