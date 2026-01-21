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
  Alert,
} from '@mantine/core';
import { useNavigate, useSearchParams } from 'react-router-dom';
import request from '../utils/request';
import { STORAGE_USER_TOKEN, STORAGE_USER_REFRESH_TOKEN } from '../constants';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await request({
        url: '/api/v2/auth/register/',
        method: 'POST',
        data: { email, password, nickname: nickname || undefined },
      });

      if (res.status === 200 && res.data) {
        const { token, refresh } = res.data;
        localStorage.setItem(STORAGE_USER_TOKEN, token);
        localStorage.setItem(STORAGE_USER_REFRESH_TOKEN, refresh);
        window.location.href = redirectTo;
      }
    } catch (e: any) {
      const errorData = e.response?.data;
      if (errorData?.code === 'EMAIL_EXISTS') {
        if (errorData.has_wechat) {
          setError('该邮箱已被微信账户使用，请直接登录或使用微信登录');
        } else {
          setError('该邮箱已注册，请直接登录');
        }
      } else {
        setError(errorData?.error || '注册失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">创建账户</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        已有账户?{' '}
        <Anchor size="sm" component="button" onClick={() => navigate(`/login?redirect_to=${encodeURIComponent(redirectTo)}`)}>
          立即登录
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
          <TextInput
            label="昵称"
            placeholder="可选"
            value={nickname}
            onChange={(e) => setNickname(e.currentTarget.value)}
          />
          <PasswordInput
            label="密码"
            placeholder="至少6位"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <PasswordInput
            label="确认密码"
            placeholder="再次输入密码"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          />
        </Stack>

        <Button fullWidth mt="xl" loading={loading} onClick={handleRegister}>
          注册
        </Button>
      </Paper>
    </Container>
  );
};

export default Register;
