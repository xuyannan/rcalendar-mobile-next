import React, { useEffect, useState } from 'react';
import { Button, Toast } from 'antd-mobile';
import { STORAGE_USER_TOKEN, APP_ID, WX_LOGIN_CALLBACK, COROS_CLIENT_ID, COROS_REDIRECT_URI, COROS_AUTH_URL } from '../constants';

const CorosBind: React.FC = () => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(STORAGE_USER_TOKEN);
        if (!token) {
            window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APP_ID}&redirect_uri=${encodeURIComponent(WX_LOGIN_CALLBACK + '?redirect_to=/bind_coros')}&response_type=code&scope=snsapi_userinfo&state=STATE`;
        }
    }, []);

    const handleBindCoros = async () => {
        if (!COROS_CLIENT_ID) {
            Toast.show({ content: 'Coros Client ID 未配置', icon: 'fail' });
            return;
        }

        setLoading(true);
        try {
            // Generate state for CSRF protection
            const state = btoa(JSON.stringify({ redirect: '/bindSuccess', timestamp: Date.now() }));
            sessionStorage.setItem('coros_state', state);

            // Build authorization URL
            // Coros OAuth2 uses standard OAuth2 flow (not PKCE)
            const authUrl = `${COROS_AUTH_URL}?client_id=${COROS_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(COROS_REDIRECT_URI)}&state=${encodeURIComponent(state)}`;

            // Redirect to Coros authorization page
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to initiate Coros OAuth:', error);
            Toast.show({ content: '生成授权参数失败', icon: 'fail' });
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 40 }}>
            <Button
                block
                color='primary'
                loading={loading}
                onClick={handleBindCoros}
            >
                绑定高驰 (Coros)
            </Button>
        </div>
    );
};

export default CorosBind;
