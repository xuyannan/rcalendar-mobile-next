import React, { useEffect, useState } from 'react';
import { Toast, SpinLoading, Button } from 'antd-mobile';
import { useSearchParams, useNavigate } from 'react-router-dom';
import request from '../utils/request';
import { COROS_REDIRECT_URI } from '../constants';

const CorosCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('正在绑定高驰 (Coros) 账号...');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
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
                // Exchange code for token via backend
                const response = await request.post('/api/v2/auth/coros-bind/', {
                    code,
                    state,
                    redirect_uri: COROS_REDIRECT_URI,
                });

                console.log('Coros bind response:', response);
                if (response.status === 200) {
                    setStatus('success');
                    setMessage('高驰 (Coros) 账号绑定成功！您的运动记录会自动同步到跑者日历平台');
                    Toast.show({ content: '绑定成功', icon: 'success' });
                } else {
                    setStatus('error');
                    setMessage(response.data.message || '绑定失败');
                }
            } catch (err: any) {
                console.error('Coros bind error:', err);
                setStatus('error');
                setMessage(err.response?.data?.error || err.response?.data?.detail || '绑定失败，请重试');
            }
        };

        handleCallback();
    }, [searchParams]);

    const handleBack = () => {
        const isMiniProgram = (window as any).__wxjs_environment === 'miniprogram';
        if (isMiniProgram) {
            (window as any).wx?.miniProgram?.navigateBack({ delta: 1 });
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

export default CorosCallback;
