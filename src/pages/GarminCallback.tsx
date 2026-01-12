import React, { useEffect, useState } from 'react';
import { Toast, SpinLoading } from 'antd-mobile';
import { useSearchParams } from 'react-router-dom';
import request from '../utils/request';
import { GARMIN_REDIRECT_URI } from '../constants';

const GarminCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('正在绑定 Garmin 账号...');

    useEffect(() => {
        const handleCallback = async () => {
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

            // Get code verifier from sessionStorage
            const codeVerifier = sessionStorage.getItem('garmin_code_verifier');
            if (!codeVerifier) {
                setStatus('error');
                setMessage('授权会话已过期，请重新绑定');
                return;
            }

            try {
                // Exchange code for token via backend
                // redirect_uri must match the one used in authorization request
                const response = await request.post('/api/v2/auth/garmin-bind/', {
                    code,
                    code_verifier: codeVerifier,
                    redirect_uri: GARMIN_REDIRECT_URI,
                });

                // Clear code verifier
                sessionStorage.removeItem('garmin_code_verifier');
                console.log('Garmin bind response:', response);
                if (response.status === 200) {
                    setStatus('success');
                    setMessage('Garmin 账号绑定成功！');
                    Toast.show({ content: '绑定成功', icon: 'success' });
                } else {
                    setStatus('error');
                    setMessage(response.data.message || '绑定失败');
                }
            } catch (err: any) {
                console.error('Garmin bind error:', err);
                setStatus('error');
                setMessage(err.response?.data?.error || err.response?.data?.detail || '绑定失败，请重试');
            }
        };

        handleCallback();
    }, [searchParams]);

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
                <div style={{ color: '#52c41a', fontSize: 48 }}>✓</div>
            )}
            {status === 'error' && (
                <div style={{ color: '#ff4d4f', fontSize: 48 }}>✗</div>
            )}
            <p style={{ marginTop: 20, textAlign: 'center' }}>{message}</p>
        </div>
    );
};

export default GarminCallback;
