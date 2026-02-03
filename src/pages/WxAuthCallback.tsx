import React, { useEffect, useState } from 'react';
import { SpinLoading } from 'antd-mobile';
import { useSearchParams } from 'react-router-dom';
import request from '../utils/request';
import { STORAGE_USER_REFRESH_TOKEN, STORAGE_USER_TOKEN } from '../constants';

const WxAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [message, setMessage] = useState<string>('正在登录...');

    useEffect(() => {
        const code = searchParams.get('code');
        const stateParam = searchParams.get('state');
        const loginType = searchParams.get('login_type');
        
        // 从 state 参数解析 action 和 redirect_to
        let action: string | null = null;
        let redirectTo: string | null = null;
        
        if (stateParam && stateParam !== 'STATE') {
            try {
                const stateObj = JSON.parse(decodeURIComponent(stateParam));
                action = stateObj.action || null;
                redirectTo = stateObj.redirect_to || null;
                // 兼容扫码登录的 login_type
                if (stateObj.login_type) {
                    // loginType from state
                }
            } catch {
                // state 不是 JSON，可能是旧的 STATE 字符串，忽略
            }
        }

        const bindWechat = async () => {
            setLoading(true);
            setMessage('正在绑定微信...');
            try {
                const res: any = await request({
                    url: '/api/v2/auth/bind-wechat/',
                    method: 'POST',
                    data: { code }
                });
                const { status } = res;
                if (status === 200) {
                    window.location.href = redirectTo || '/user/account';
                } else {
                    setError(res);
                }
            } catch (e: any) {
                const errMsg = e.response?.data?.error || e.response?.data?.message || '绑定失败';
                setError({ message: errMsg });
            } finally {
                setLoading(false);
            }
        };

        const login = async () => {
            setLoading(true);
            setMessage('正在登录...');
            try {
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
            if (action === 'bind') {
                bindWechat();
            } else {
                login();
            }
        }
    }, [searchParams]);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}><SpinLoading /></div>
    }

    if (error) {
        return (
            <div style={{ padding: 20, textAlign: 'center' }}>
                <h3 style={{ color: '#ff4d4f' }}>操作失败</h3>
                <p>{error.message || JSON.stringify(error)}</p>
                <a href="/user/account">返回账户管理</a>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, textAlign: 'center' }}>
            <h3>{message}</h3>
        </div>
    );
};

export default WxAuthCallback;
