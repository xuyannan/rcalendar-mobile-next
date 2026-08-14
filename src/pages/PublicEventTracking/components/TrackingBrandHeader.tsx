import { Anchor, Group, Image } from '@mantine/core';

const SOCIAL_LINKS = [
  {
    href: 'https://www.xiaoyuzhoufm.com/podcast/5e7c65d0418a84a046740885',
    label: '小宇宙',
    src: '/social/xiaoyuzhou.png',
  },
  {
    href: 'https://xhslink.cn/m/1R8csRdx5i2',
    label: '小红书',
    src: '/social/xiaohongshu.svg',
  },
  {
    href: 'https://b23.tv/fs7XXlb',
    label: 'B站',
    src: '/social/bilibili.svg',
  },
];

const TrackingBrandHeader = () => (
  <Group
    component="header"
    justify="space-between"
    align="center"
    mb="md"
    wrap="wrap"
    gap="sm"
  >
    <Image
      src="/logo-wide-black.png"
      alt="跑者日历"
      h={30}
      w="auto"
      fit="contain"
    />
    <Group gap="sm" wrap="nowrap">
      {SOCIAL_LINKS.map((link) => (
        <Anchor
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.label}
          title={link.label}
        >
          <Image
            src={link.src}
            alt={link.label}
            h={18}
            w={18}
            fit="contain"
          />
        </Anchor>
      ))}
    </Group>
  </Group>
);

export default TrackingBrandHeader;
