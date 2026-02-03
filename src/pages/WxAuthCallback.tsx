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
        alert(stateParam)
        
        // state=bind 表示绑定微信操作
        const isBind = stateParam === 'bind';

        const bindWechat = async () => {
            setLoading(true);
            setMessage('正在绑定微信...');
            try {
                const res: any = await request({
                    url: '/api/v2/auth/bind-wechat/',
                    method: 'POST',
                    data: { code, login_type: 'mobile' }
                });
                const { status } = res;
                if (status === 200) {
                    window.location.href = '/user/account';
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
                const url = '/api/v2/auth/wechat-browser-auth/';
                
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
                    window.location.href = '/';
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
            if (isBind) {
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
