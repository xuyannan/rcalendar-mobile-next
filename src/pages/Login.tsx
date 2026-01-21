import { useState } from 'react';
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Stack,
  Divider,
  Alert,
} from '@mantine/core';
import { useNavigate, useSearchParams } from 'react-router-dom';
import request from '../utils/request';
import { STORAGE_USER_TOKEN, STORAGE_USER_REFRESH_TOKEN, WX_LOGIN_URL } from '../constants';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await request({
        url: '/api/v2/auth/login/',
        method: 'POST',
        data: { email, password },
      });

      if (res.status === 200 && res.data) {
        const { token, refresh } = res.data;
        localStorage.setItem(STORAGE_USER_TOKEN, token);
        localStorage.setItem(STORAGE_USER_REFRESH_TOKEN, refresh);
        window.location.href = redirectTo;
      }
    } catch (e: any) {
      const errorData = e.response?.data;
      if (errorData?.code === 'USER_NOT_FOUND') {
        setError('用户不存在，请先注册');
      } else if (errorData?.code === 'INVALID_PASSWORD') {
        setError('密码错误');
      } else if (errorData?.code === 'NO_PASSWORD') {
        setError('该账户通过微信创建，请使用微信登录或先设置密码');
      } else {
        setError(errorData?.error || '登录失败');
      }
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

  return (
    <Container size={420} my={40}>
      <Title ta="center">欢迎回来</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        还没有账户?{' '}
        <Anchor size="sm" component="button" onClick={() => navigate(`/register?redirect_to=${encodeURIComponent(redirectTo)}`)}>
          立即注册
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}

        <Stack>
          <TextInput
            label="邮箱"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            label="密码"
            placeholder="输入密码"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
        </Stack>

        <Button fullWidth mt="xl" loading={loading} onClick={handleLogin}>
          登录
        </Button>

        <Divider label="或" labelPosition="center" my="lg" />

        <Button
          fullWidth
          variant="outline"
          color="green"
          onClick={handleWeChatLogin}
        >
          微信登录
        </Button>
      </Paper>
    </Container>
  );
};

export default Login;
