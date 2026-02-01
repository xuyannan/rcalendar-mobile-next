import React, { useEffect, useState } from 'react';
import { SpinLoading } from 'antd-mobile';
import { useSearchParams } from 'react-router-dom';
import request from '../utils/request';
import { STORAGE_USER_REFRESH_TOKEN, STORAGE_USER_TOKEN } from '../constants';

const WxAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const redirectTo = searchParams.get('redirect_to');
        const loginType = searchParams.get('login_type');

        const login = async () => {
            setLoading(true);
            debugger
            try {
                // 根据login_type选择不同的登录接口
                const url = loginType === 'qrcode' 
                    ? '/api/v2/auth/wx-qrcode-login/'
                    : '/api/v2/auth/wechat-browser-auth/';
                
                const res: any = await request({
                    url,
                    method: 'POST',
                    data: { code }
                });
                const { data, status } = res;
                if (status === 200) {
                    const { token, refresh } = data;
                    localStorage.setItem(STORAGE_USER_TOKEN, token);
                    localStorage.setItem(STORAGE_USER_REFRESH_TOKEN, refresh);
                    if (redirectTo) {
                        window.location.href = redirectTo;
                    } else {
                        window.location.href = '/';
                    }
                } else {
                    setError(res);
                }
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        };

        if (code) {
            login();
        }
    }, [searchParams]);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}><SpinLoading /></div>
    }

    if (error) {
        return <div>Error: {JSON.stringify(error)}</div>
    }

    return (
        <div style={{ padding: 20, textAlign: 'center' }}>
            <h3>正在登录...</h3>
        </div>
    );
};

export default WxAuthCallback;
