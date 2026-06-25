import React, { useEffect, useRef, useState } from 'react';
import { Toast, SpinLoading, Button } from 'antd-mobile';
import { useSearchParams, useNavigate } from 'react-router-dom';
import request from '../utils/request';

const StravaCallbackV2: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('正在绑定 Strava 账号...');
    const handledRef = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            if (handledRef.current) return;
            handledRef.current = true;

            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage('授权失败: ' + (searchParams.get('error_description') || error));
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('未获取到授权码');
                return;
            }

            try {
                const response = await request.post('/api/v2/auth/strava-bind/', { code }) as {
                    status?: number;
                    data?: { message?: string };
                };
                if (response.status === 200) {
                    setStatus('success');
                    setMessage('Strava 账号绑定成功！您的运动记录会自动同步到跑者日历平台');
                    Toast.show({ content: '绑定成功', icon: 'success' });
                } else {
                    setStatus('error');
                    setMessage(response.data?.message || '绑定失败');
                }
            } catch (err) {
                const e = err as { response?: { data?: { error?: string; detail?: string } } };
                setStatus('error');
                setMessage(e.response?.data?.error || e.response?.data?.detail || '绑定失败，请重试');
            }
        };

        handleCallback();
    }, [searchParams]);

    const handleBack = () => {
        const w = window as unknown as {
            __wxjs_environment?: string;
            wx?: { miniProgram?: { navigateBack?: (opts: { delta: number }) => void } };
        };
        const isMiniProgram = w.__wxjs_environment === 'miniprogram';
        if (isMiniProgram) {
            w.wx?.miniProgram?.navigateBack?.({ delta: 1 });
        } else {
            navigate('/user/bindDevice');
        }
    };

    return (
        <div style={{
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            {status === 'loading' && <SpinLoading style={{ '--size': '48px' }} />}
            {status === 'success' && (
                <div style={{ color: '#52c41a', fontSize: 48 }}>🎉</div>
            )}
            {status === 'error' && (
                <div style={{ color: '#ff4d4f', fontSize: 48 }}>⚠️</div>
            )}
            <p style={{ marginTop: 20, textAlign: 'center' }}>{message}</p>
            {(status === 'success' || status === 'error') && (
                <Button
                    color="primary"
                    style={{ marginTop: 20 }}
                    onClick={handleBack}
                >
                    返回设备绑定
                </Button>
            )}
        </div>
    );
};

export default StravaCallbackV2;
