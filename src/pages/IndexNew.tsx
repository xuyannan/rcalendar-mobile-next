import {
  Container,
  Title,
  Text,
  Image,
  SimpleGrid,
  Card,
  Group,
  Avatar,
  Stack,
  Box,
  Anchor,
  useMantineColorScheme,
} from '@mantine/core';
import { HeaderMegaMenu } from '../components/HeaderMegaMenu';

import bg from '../assets/background.jpg';
import logo from '../assets/logo.png';
import run365Img from '../assets/podcasts/run365.png';
import gearTalkImg from '../assets/podcasts/gearTalk.png';
import pbPlanImg from '../assets/podcasts/pbPlan.jpg';
import first100Img from '../assets/podcasts/first100.png';
import janice from '../assets/hosts/janice.png';
import nanzi from '../assets/hosts/nanzi.png';
import yangbo from '../assets/hosts/yangbo.png';
import coros from '../assets/brands/coros.png';
import adidas from '../assets/brands/adidas.png';
import outopia from '../assets/brands/outopia.png';
import lululemon from '../assets/brands/lululemon.png';
import on from '../assets/brands/on.png';
import brooks from '../assets/brands/brooks.png';
import acg from '../assets/brands/acg.png';
import altra from '../assets/brands/altra.png';
import skins from '../assets/brands/skins.png';
import mitoq from '../assets/brands/mitoq.png';
import ag1 from '../assets/brands/ag1.png';

const stats = [
  { value: '540+', label: 'Episodes' },
  { value: '55,000+', label: 'Subscribers' },
  { value: '6,000,000+', label: 'Plays' },
  { value: '10,000+', label: 'Average plays for each episode' },
  { value: '200+', label: 'Average comments for each episode' },
];

const hosts = [
  {
    name: '佳凝',
    avatar: janice,
    intro: '体育行业资深从业者，马拉松爱好者，完成超过50场马拉松和越野赛，五星大满贯跑者，拥有丰富的海外参赛经验。',
  },
  {
    name: '南子',
    avatar: nanzi,
    intro: '计算机前端开发技术专家，连续创业者，马拉松、越野跑和户外运动爱好者。',
  },
  {
    name: '杨波',
    avatar: yangbo,
    intro: '装备达人，多个知名跑鞋品牌资深测试跑者，全马PB 2小时48分，越野赛多次登上领奖台。',
  },
];

const brands = [
  { name: 'coros', logo: coros },
  { name: 'adidas', logo: adidas },
  { name: 'outopia', logo: outopia },
  { name: 'lululemon', logo: lululemon },
  { name: 'on', logo: on },
  { name: 'brooks', logo: brooks },
  { name: 'acg', logo: acg },
  { name: 'altra', logo: altra },
  { name: 'skins', logo: skins },
  { name: 'mitoq', logo: mitoq },
  { name: 'ag1', logo: ag1 },
];

const contacts = [
  { label: '商务合作微信号', value: 'janicegooner' },
  { label: '客服及加入听众群微信号', value: 'paozherili' },
];

const podcasts = [
  { img: run365Img, alt: 'Run365' },
  { img: gearTalkImg, alt: 'Gear Talk' },
  { img: pbPlanImg, alt: 'PB Plan' },
  { img: first100Img, alt: 'First 100' },
];

export default function IndexNew() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Box>
      <HeaderMegaMenu />

      {/* Cover Section */}
      <Box
        style={{
          minHeight: '100vh',
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
        />
        <Container size="lg" style={{ position: 'relative', height: '100vh' }}>
          <Box
            style={{
              position: 'absolute',
              top: '30%',
              right: '10%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <Image src={logo} alt="Logo" w={120} h={120} fit="contain" mb={20} />
            <Text
              c="white"
              size="xl"
              fw={700}
              style={{ letterSpacing: 2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              有料，有趣的跑步播客
            </Text>
          </Box>
        </Container>
      </Box>

      {/* Album Section */}
      <Box py={60} bg={isDark ? 'dark.7' : 'white'}>
        <Container size="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl">
            {podcasts.map((podcast) => (
              <Box key={podcast.alt} style={{ display: 'flex', justifyContent: 'center' }}>
                <Image src={podcast.img} alt={podcast.alt} w={120} h={120} fit="contain" />
              </Box>
            ))}
          </SimpleGrid>

          <Stack gap="md" mt={40}>
            <Text c={isDark ? 'gray.3' : 'gray.7'} size="sm" style={{ lineHeight: 1.6, textAlign: 'justify' }}>
              《跑者日历》（Run365）是一档专注于跑步、马拉松、越野跑以及健康生活方式的播客。拥有超过300期节目，它已经发展成为一个拥有丰富主题的多元化"播客宇宙"。
            </Text>
            <Text c={isDark ? 'gray.3' : 'gray.7'} size="sm" style={{ lineHeight: 1.6, textAlign: 'justify' }}>
              目前的播客矩阵包含多档定期更新的节目，包括《跑者日历》（Run365）、《装备说》（Gear Talk）、《PB计划》（The PB Project）以及《首百计划》（The First 100K）。
            </Text>
            <Text c={isDark ? 'gray.3' : 'gray.7'} size="sm" style={{ lineHeight: 1.6, textAlign: 'justify' }}>
              不同的节目面向跑步圈内不同的群体，并尝试多样化的形式。例如，《跑者日历》是关于跑者日常生活的每周闲聊，而《PB计划》则是一档为初学者和追求新个人纪录的跑者打造的音频纪录片式训练系列节目。
            </Text>
            <Text c={isDark ? 'gray.3' : 'gray.7'} size="sm" style={{ lineHeight: 1.6, textAlign: 'justify' }}>
              每周至少更新三期新节目，我们在不同时间连接不同类型的听众——确保每一阶段的跑者都能从中获得有价值的内容。
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Numbers Section */}
      <Box py={60} bg={isDark ? 'dark.8' : 'gray.0'}>
        <Container size="md">
          <Title order={2} ta="center" mb={40}>数据</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {stats.map((item) => (
              <Card key={item.label} padding="lg" radius="md" withBorder>
                <Text size="xl" fw={700} ta="center" style={{ fontSize: 36 }}>
                  {item.value}
                </Text>
                <Text c="dimmed" size="sm" ta="center" mt="xs">
                  {item.label}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Hosts Section */}
      <Box py={60} bg={isDark ? 'dark.7' : 'white'}>
        <Container size="md">
          <Title order={2} ta="center" mb={40}>主播</Title>
          <Stack gap="xl">
            {hosts.map((host) => (
              <Group key={host.name} gap="lg" wrap="nowrap" align="flex-start">
                <Avatar src={host.avatar} size={80} radius="xl" />
                <Box>
                  <Text size="lg" fw={700} mb={6}>{host.name}</Text>
                  <Text c="dimmed" size="sm" style={{ lineHeight: 1.5 }}>{host.intro}</Text>
                </Box>
              </Group>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Brands Section */}
      <Box py={60} bg={isDark ? 'dark.8' : 'gray.0'}>
        <Container size="md">
          <Title order={2} ta="center" mb={40}>合作伙伴</Title>
          <SimpleGrid cols={{ base: 3, sm: 4, md: 6 }} spacing="xl">
            {brands.map((brand) => (
              <Box key={brand.name} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Image src={brand.logo} alt={brand.name} w={60} h={60} fit="contain" />
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box py={60} bg={isDark ? 'dark.7' : 'white'}>
        <Container size="md">
          <Title order={2} mb={24}>联系我们</Title>
          <Stack gap="md">
            {contacts.map((item) => (
              <Box key={item.label}>
                <Text size="sm" c="dimmed" mb={4}>{item.label}</Text>
                <Text size="lg" fw={500}>{item.value}</Text>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={20} bg={isDark ? 'dark.9' : 'gray.1'}>
        <Container size="md">
          <Text ta="center" size="xs" c="dimmed">
            备案号:京ICP备20004918号 | <Anchor href="/privacy" size="xs" c="dimmed">隐私政策</Anchor>
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
