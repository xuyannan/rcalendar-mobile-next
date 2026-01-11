import React, { useEffect, useState } from 'react';
import { Button, Toast } from 'antd-mobile';
import { STORAGE_USER_TOKEN, APP_ID, WX_LOGIN_CALLBACK, GARMIN_CLIENT_ID, GARMIN_REDIRECT_URI, GARMIN_AUTH_URL } from '../constants';

// Generate random string for PKCE
const generateRandomString = (length: number): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
    }
    return result;
};

// Generate code challenge from code verifier (SHA256 + Base64URL)
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    // Convert to Base64URL
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const GarminBind: React.FC = () => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(STORAGE_USER_TOKEN);
        if (!token) {
            window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APP_ID}&redirect_uri=${encodeURIComponent(WX_LOGIN_CALLBACK + '?redirect_to=/bind_garmin')}&response_type=code&scope=snsapi_userinfo&state=STATE`;
        }
    }, []);

    const handleBindGarmin = async () => {
        if (!GARMIN_CLIENT_ID) {
            Toast.show({ content: 'Garmin Client ID 未配置', icon: 'fail' });
            return;
        }

        setLoading(true);
        try {
            // Generate PKCE code verifier and challenge
            const codeVerifier = generateRandomString(64);
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            // Store code verifier in sessionStorage for callback use
            sessionStorage.setItem('garmin_code_verifier', codeVerifier);

            // Build authorization URL with PKCE
            const state = btoa(JSON.stringify({ redirect: '/bindSuccess' }));
            const authUrl = `${GARMIN_AUTH_URL}?client_id=${GARMIN_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(GARMIN_REDIRECT_URI)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${encodeURIComponent(state)}`;

            // Redirect to Garmin authorization page
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to generate PKCE:', error);
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
                onClick={handleBindGarmin}
            >
                绑定 Garmin
            </Button>
        </div>
    );
};

export default GarminBind;
