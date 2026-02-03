import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
  Group,
  Checkbox,
  Anchor,
  Modal,
  ScrollArea,
  Tabs,
  Box,
  Center,
  Loader,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBrandWechat, IconMail, IconPhone, IconQrcode } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import request from '../utils/request';
import {
  STORAGE_USER_TOKEN,
  STORAGE_USER_REFRESH_TOKEN,
  WX_LOGIN_URL,
  WX_OPEN_APPID,
} from '../constants';

const TERMS_CONTENT = `跑步日历用户服务条款

最后更新日期：2025年1月

欢迎使用跑步日历（以下简称"本平台"）。在使用本平台服务之前，请您仔细阅读并充分理解以下条款。

一、服务说明

1.1 本平台为用户提供跑步赛事信息查询、赛事报名、运动数据管理等服务。

1.2 本平台有权根据业务发展需要，对服务内容进行调整或优化。

二、用户注册与账户

2.1 用户应提供真实、准确的个人信息进行注册，并在信息变更时及时更新。

2.2 用户应妥善保管账户信息，因账户被盗用导致的损失由用户自行承担。

2.3 用户不得将账户转让、出借给他人使用。

三、用户行为规范

3.1 用户应遵守中华人民共和国相关法律法规。

3.2 用户不得利用本平台从事以下行为：
- 发布违法、虚假、诈骗信息
- 侵犯他人知识产权或其他合法权益
- 干扰平台正常运营
- 其他违反法律法规或平台规则的行为

四、隐私保护

4.1 本平台重视用户隐私保护，将按照《隐私政策》收集、使用和保护用户个人信息。

4.2 未经用户同意，本平台不会向第三方披露用户个人信息，但法律法规另有规定的除外。

五、知识产权

5.1 本平台的商标、标识、软件、内容等知识产权归平台所有。

5.2 用户在平台发布的内容，授权平台在平台范围内使用。

六、免责声明

6.1 本平台提供的赛事信息仅供参考，具体以赛事官方公告为准。

6.2 因不可抗力、第三方原因等导致的服务中断或损失，本平台不承担责任。

6.3 用户参与赛事活动应自行评估风险，因运动导致的人身伤害由用户自行承担。

七、条款变更

7.1 本平台有权根据需要修改本条款，修改后的条款将在平台公布。

7.2 用户继续使用本平台服务即表示同意修改后的条款。

八、争议解决

8.1 本条款的解释和适用以中华人民共和国法律为准。

8.2 因本条款产生的争议，双方应协商解决；协商不成的，可向本平台所在地人民法院提起诉讼。

九、联系我们

如有任何问题，请通过以下方式联系我们：
- 邮箱：support@run365.info

感谢您使用跑步日历！`;

const isWeChatBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || '/';
  const isWeChat = isWeChatBrowser();

  const [activeTab, setActiveTab] = useState<string | null>(
    isWeChat ? 'wechat' : 'phone'
  );
  const isMobile = useMediaQuery('(max-width: 480px)');

  // Phone login state
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Email login state
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // QR Code state
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  // Load WeChat QR code when tab changes to qrcode
  useEffect(() => {
    if (activeTab === 'qrcode' && qrContainerRef.current && WX_OPEN_APPID) {
      setQrLoading(true);
      qrContainerRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
      script.onload = () => {
        if (window.WxLogin && qrContainerRef.current) {
          new window.WxLogin({
            self_redirect: false,
            id: 'wx-qrcode-container',
            appid: WX_OPEN_APPID,
            scope: 'snsapi_login',
            redirect_uri: encodeURIComponent(
              `${window.location.origin}/wx_auth_callback?redirect_to=${encodeURIComponent(redirectTo)}&login_type=qrcode`
            ),
            state: 'qrcode',
            style: 'black',
            href: '',
          });
        }
        setQrLoading(false);
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [activeTab, redirectTo]);

  const validatePhone = (value: string) => {
    return /^1[3-9]\d{9}$/.test(value);
  };

  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError('请输入有效的手机号码');
      return;
    }

    setSendingCode(true);
    setError(null);

    try {
      await request({
        url: '/api/v2/auth/send-sms/',
        method: 'POST',
        data: { phone },
      });
      setCountdown(60);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!validatePhone(phone)) {
      setError('请输入有效的手机号码');
      return;
    }
    if (!smsCode || smsCode.length < 4) {
      setError('请输入验证码');
      return;
    }
    if (!agreedTerms) {
      setError('请先阅读并同意服务条款');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await request({
        url: '/api/v2/auth/phone-login/',
        method: 'POST',
        data: { phone, code: smsCode, agreedTerms },
      }) as { status: number; data: { token: string; refresh: string } };

      if (res.status === 200 && res.data) {
        const { token, refresh } = res.data;
        localStorage.setItem(STORAGE_USER_TOKEN, token);
        localStorage.setItem(STORAGE_USER_REFRESH_TOKEN, refresh);
        window.location.href = redirectTo;
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSendEmailCode = async () => {
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setSendingEmailCode(true);
    setError(null);

    try {
      await request({
        url: '/api/v2/auth/send-email-code/',
        method: 'POST',
        data: { email },
      });
      setEmailCountdown(60);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || '发送验证码失败');
    } finally {
      setSendingEmailCode(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!emailCode || emailCode.length < 4) {
      setError('请输入验证码');
      return;
    }
    if (!agreedTerms) {
      setError('请先阅读并同意服务条款');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await request({
        url: '/api/v2/auth/email-code-login/',
        method: 'POST',
        data: { email, code: emailCode, agreedTerms },
      }) as { status: number; data: { token: string; refresh: string } };

      if (res.status === 200 && res.data) {
        const { token, refresh } = res.data;
        localStorage.setItem(STORAGE_USER_TOKEN, token);
        localStorage.setItem(STORAGE_USER_REFRESH_TOKEN, refresh);
        window.location.href = redirectTo;
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleWeChatLogin = () => {
    const callbackUrl = encodeURIComponent(
      `${window.location.origin}/wx_auth_callback?redirect_to=${encodeURIComponent(redirectTo)}`
    );
    window.location.href = `${WX_LOGIN_URL}&redirect_uri=${callbackUrl}`;
  };

  const TermsCheckbox = () => (
    <Checkbox
      label={
        <Text size="sm">
          我已阅读并同意
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              setTermsModalOpen(true);
            }}
          >
            《服务条款》
          </Anchor>
        </Text>
      }
      checked={agreedTerms}
      onChange={(e) => setAgreedTerms(e.currentTarget.checked)}
    />
  );

  return (
    <Container size={480} my={40}>
      <Title ta="center">登录 / 注册</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && (
          <Alert color="red" mb="md" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            {isWeChat && (
              <Tabs.Tab value="wechat" leftSection={<IconBrandWechat size={16} color={activeTab === 'wechat' ? '#07C160' : undefined} />}>
                {!isMobile && '微信登录'}
              </Tabs.Tab>
            )}
            <Tabs.Tab value="phone" leftSection={<IconPhone size={16} color={activeTab === 'phone' ? '#228be6' : undefined} />}>
              {!isMobile && '手机号'}
            </Tabs.Tab>
            <Tabs.Tab value="email" leftSection={<IconMail size={16} color={activeTab === 'email' ? '#fa5252' : undefined} />}>
              {!isMobile && '邮箱'}
            </Tabs.Tab>
            {!isWeChat && WX_OPEN_APPID && (
              <Tabs.Tab value="qrcode" leftSection={<IconQrcode size={16} color={activeTab === 'qrcode' ? '#be4bdb' : undefined} />}>
                {!isMobile && '扫码登录'}
              </Tabs.Tab>
            )}
          </Tabs.List>

          {/* 微信登录 - 仅在微信环境显示 */}
          {isWeChat && (
            <Tabs.Panel value="wechat" pt="xl">
              <Stack>
                <Text ta="center" c="dimmed" size="sm">
                  点击下方按钮，使用微信账号快速登录
                </Text>
                <TermsCheckbox />
                <Button
                  fullWidth
                  size="lg"
                  color="green"
                  leftSection={<IconBrandWechat size={20} />}
                  onClick={handleWeChatLogin}
                  disabled={!agreedTerms}
                >
                  微信一键登录
                </Button>
              </Stack>
            </Tabs.Panel>
          )}

          {/* 手机号登录 */}
          <Tabs.Panel value="phone" pt="xl">
            <Stack>
              <TextInput
                label="手机号"
                placeholder="请输入手机号"
                required
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                maxLength={11}
              />
              <Group align="flex-end" gap="xs">
                <TextInput
                  label="验证码"
                  placeholder="请输入验证码"
                  required
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.currentTarget.value)}
                  maxLength={6}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="outline"
                  onClick={handleSendCode}
                  loading={sendingCode}
                  disabled={countdown > 0 || !validatePhone(phone)}
                  style={{ width: 120 }}
                >
                  {countdown > 0 ? `${countdown}秒` : '获取验证码'}
                </Button>
              </Group>
              <TermsCheckbox />
              <Button fullWidth loading={loading} onClick={handlePhoneLogin}>
                登录 / 注册
              </Button>
              <Text size="xs" c="dimmed" ta="center">
                未注册用户将自动创建账户
              </Text>
            </Stack>
          </Tabs.Panel>

          {/* 邮箱登录 */}
          <Tabs.Panel value="email" pt="xl">
            <Stack>
              <TextInput
                label="邮箱"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <Group align="flex-end" gap="xs">
                <TextInput
                  label="验证码"
                  placeholder="请输入验证码"
                  required
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.currentTarget.value)}
                  maxLength={6}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="outline"
                  onClick={handleSendEmailCode}
                  loading={sendingEmailCode}
                  disabled={emailCountdown > 0 || !validateEmail(email)}
                  style={{ width: 120 }}
                >
                  {emailCountdown > 0 ? `${emailCountdown}秒` : '获取验证码'}
                </Button>
              </Group>
              <TermsCheckbox />
              <Button fullWidth loading={loading} onClick={handleEmailLogin}>
                登录 / 注册
              </Button>
              <Text size="xs" c="dimmed" ta="center">
                未注册用户将自动创建账户
              </Text>
            </Stack>
          </Tabs.Panel>

          {/* 微信扫码登录 - 非微信环境显示 */}
          {!isWeChat && WX_OPEN_APPID && (
            <Tabs.Panel value="qrcode" pt="xl">
              <Stack>
                <Text ta="center" c="dimmed" size="sm">
                  使用微信扫描二维码登录
                </Text>
                <Box>
                  <Center>
                    {qrLoading && <Loader />}
                    <div
                      id="wx-qrcode-container"
                      ref={qrContainerRef}
                      style={{ minHeight: 300 }}
                    />
                  </Center>
                </Box>
                <TermsCheckbox />
                <Text size="xs" c="dimmed" ta="center">
                  扫码即表示同意服务条款
                </Text>
              </Stack>
            </Tabs.Panel>
          )}

          {/* 非微信环境但没有配置扫码登录时，显示微信登录提示 */}
          {!isWeChat && !WX_OPEN_APPID && (
            <Tabs.Panel value="qrcode" pt="xl">
              <Stack>
                <Alert color="yellow">
                  微信扫码登录暂未配置，请使用其他方式登录
                </Alert>
              </Stack>
            </Tabs.Panel>
          )}
        </Tabs>
      </Paper>

      <Modal
        opened={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="服务条款"
        size="lg"
      >
        <ScrollArea h={400}>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {TERMS_CONTENT}
          </Text>
        </ScrollArea>
        <Group justify="flex-end" mt="md">
          <Button
            onClick={() => {
              setAgreedTerms(true);
              setTermsModalOpen(false);
            }}
          >
            我已阅读并同意
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WxLogin: any;
  }
}

export default Login;
