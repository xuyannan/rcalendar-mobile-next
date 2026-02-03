import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Card,
  Text,
  Badge,
  Button,
  Group,
  Title,
  Stack,
  TextInput,
  PasswordInput,
  Modal,
  Alert,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBrandWechat, IconMail, IconLock, IconCheck, IconAlertCircle, IconPhone } from '@tabler/icons-react';
import request from '../../utils/request';
import type { UserInfo } from '../../types/user';
import { APP_ID } from '../../constants';

interface OutletContext {
  user: UserInfo;
  setUser: (user: UserInfo) => void;
}

export default function AccountManage() {
  const { user, setUser } = useOutletContext<OutletContext>();
  
  const [bindEmailOpened, { open: openBindEmail, close: closeBindEmail }] = useDisclosure(false);
  const [setPasswordOpened, { open: openSetPassword, close: closeSetPassword }] = useDisclosure(false);
  const [bindPhoneOpened, { open: openBindPhone, close: closeBindPhone }] = useDisclosure(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasWechat = !!user.openid;
  const hasEmail = !!user.email;
  const hasPassword = user.has_password;
  const hasPhone = !!user.phone;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleBindPhone = async () => {
    if (!validatePhone(phone)) {
      setError('请输入有效的手机号码');
      return;
    }
    if (!smsCode || smsCode.length < 4) {
      setError('请输入验证码');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res: any = await request({
        url: '/api/v2/auth/bind-phone/',
        method: 'POST',
        data: { phone, code: smsCode },
      });
      
      if (res.data) {
        setUser(res.data);
      } else {
        setUser({ ...user, phone: parseInt(phone) });
      }
      setSuccess('手机号绑定成功');
      closeBindPhone();
      setPhone('');
      setSmsCode('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { code?: string; error?: string } } };
      if (err.response?.data?.code === 'PHONE_CONFLICT') {
        setError('该手机号已被其他账户使用');
      } else if (err.response?.data?.code === 'INVALID_CODE') {
        setError('验证码错误或已过期');
      } else {
        setError(err.response?.data?.error || '绑定失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBindEmail = async () => {
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await request({
        url: '/api/v2/auth/bind-email/',
        method: 'POST',
        data: { email, password: password || undefined },
      });
      
      setUser({ ...user, email, has_password: password ? true : user.has_password });
      setSuccess('邮箱绑定成功');
      closeBindEmail();
      setEmail('');
      setPassword('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { code?: string; error?: string } } };
      if (err.response?.data?.code === 'EMAIL_CONFLICT') {
        setError('该邮箱已被其他账户使用');
      } else {
        setError(err.response?.data?.error || '绑定失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword) {
      setError('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (hasPassword && !oldPassword) {
      setError('请输入原密码');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await request({
        url: '/api/v2/auth/set-password/',
        method: 'POST',
        data: {
          password: newPassword,
          old_password: hasPassword ? oldPassword : undefined,
        },
      });
      
      setUser({ ...user, has_password: true });
      setSuccess('密码设置成功');
      closeSetPassword();
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { code?: string; error?: string } } };
      if (err.response?.data?.code === 'INVALID_OLD_PASSWORD') {
        setError('原密码错误');
      } else {
        setError(err.response?.data?.error || '设置失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBindWechat = () => {
    const state = encodeURIComponent(JSON.stringify({
      action: 'bind',
      redirect_to: '/user/account',
    }));
    const redirectUri = encodeURIComponent('https://m.run365.info/wx_auth_callback');
    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
  };

  return (
    <div>
      <Title order={2} mb="lg">账户管理</Title>
      <Text c="dimmed" mb="xl">
        管理您的登录方式和账户安全
      </Text>

      {success && (
        <Alert icon={<IconCheck size={16} />} color="green" mb="lg" onClose={() => setSuccess(null)} withCloseButton>
          {success}
        </Alert>
      )}

      <Stack gap="lg">
        {/* 微信绑定状态 */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Group>
              <IconBrandWechat size={24} color="#07C160" />
              <div>
                <Text fw={500}>微信账户</Text>
                <Text size="sm" c="dimmed">
                  {hasWechat ? '已绑定微信账户' : '未绑定微信，绑定后可使用微信登录'}
                </Text>
              </div>
            </Group>
            <Group>
              <Badge color={hasWechat ? 'green' : 'gray'} variant="light">
                {hasWechat ? '已绑定' : '未绑定'}
              </Badge>
              {!hasWechat && (
                <Button variant="light" color="green" size="sm" onClick={handleBindWechat}>
                  绑定微信
                </Button>
              )}
            </Group>
          </Group>
        </Card>

        {/* 邮箱绑定状态 */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Group>
              <IconMail size={24} color="#228BE6" />
              <div>
                <Text fw={500}>邮箱</Text>
                <Text size="sm" c="dimmed">
                  {hasEmail ? user.email : '未绑定邮箱，绑定后可使用邮箱登录'}
                </Text>
              </div>
            </Group>
            <Group>
              <Badge color={hasEmail ? 'green' : 'gray'} variant="light">
                {hasEmail ? '已绑定' : '未绑定'}
              </Badge>
              {!hasEmail && (
                <Button variant="light" size="sm" onClick={openBindEmail}>
                  绑定邮箱
                </Button>
              )}
            </Group>
          </Group>
        </Card>

        {/* 密码状态 */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Group>
              <IconLock size={24} color="#868E96" />
              <div>
                <Text fw={500}>登录密码</Text>
                <Text size="sm" c="dimmed">
                  {hasPassword ? '已设置密码' : '未设置密码，设置后可使用密码登录'}
                </Text>
              </div>
            </Group>
            <Group>
              <Badge color={hasPassword ? 'green' : 'gray'} variant="light">
                {hasPassword ? '已设置' : '未设置'}
              </Badge>
              <Button variant="light" size="sm" onClick={openSetPassword}>
                {hasPassword ? '修改密码' : '设置密码'}
              </Button>
            </Group>
          </Group>
        </Card>

        {/* 手机号绑定状态 */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Group>
              <IconPhone size={24} color="#FA5252" />
              <div>
                <Text fw={500}>手机号</Text>
                <Text size="sm" c="dimmed">
                  {hasPhone ? String(user.phone) : '未绑定手机号，绑定后可使用手机号登录'}
                </Text>
              </div>
            </Group>
            <Group>
              <Badge color={hasPhone ? 'green' : 'gray'} variant="light">
                {hasPhone ? '已绑定' : '未绑定'}
              </Badge>
              {!hasPhone && (
                <Button variant="light" color="red" size="sm" onClick={openBindPhone}>
                  绑定手机号
                </Button>
              )}
            </Group>
          </Group>
        </Card>

        {/* 账户安全提示 */}
        {!hasWechat && !hasEmail && (
          <Alert icon={<IconAlertCircle size={16} />} color="yellow">
            建议至少绑定一种登录方式（微信或邮箱），以确保账户安全
          </Alert>
        )}
      </Stack>

      {/* 绑定邮箱弹窗 */}
      <Modal opened={bindEmailOpened} onClose={closeBindEmail} title="绑定邮箱">
        <Stack>
          {error && (
            <Alert color="red" onClose={() => setError(null)} withCloseButton>
              {error}
            </Alert>
          )}
          <TextInput
            label="邮箱地址"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <Divider label="同时设置密码（可选）" labelPosition="center" />
          <PasswordInput
            label="登录密码"
            placeholder="至少6位，可选"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Button loading={loading} onClick={handleBindEmail}>
            确认绑定
          </Button>
        </Stack>
      </Modal>

      {/* 设置密码弹窗 */}
      <Modal opened={setPasswordOpened} onClose={closeSetPassword} title={hasPassword ? '修改密码' : '设置密码'}>
        <Stack>
          {error && (
            <Alert color="red" onClose={() => setError(null)} withCloseButton>
              {error}
            </Alert>
          )}
          {hasPassword && (
            <PasswordInput
              label="原密码"
              placeholder="请输入原密码"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.currentTarget.value)}
            />
          )}
          <PasswordInput
            label="新密码"
            placeholder="至少6位"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
          />
          <PasswordInput
            label="确认新密码"
            placeholder="再次输入新密码"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          />
          <Button loading={loading} onClick={handleSetPassword}>
            确认
          </Button>
        </Stack>
      </Modal>

      {/* 绑定手机号弹窗 */}
      <Modal opened={bindPhoneOpened} onClose={closeBindPhone} title="绑定手机号">
        <Stack>
          {error && (
            <Alert color="red" onClose={() => setError(null)} withCloseButton>
              {error}
            </Alert>
          )}
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
          <Button loading={loading} onClick={handleBindPhone}>
            确认绑定
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
