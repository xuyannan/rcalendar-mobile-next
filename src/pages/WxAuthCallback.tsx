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

        const login = async () => {
            setLoading(true);
            try {
                const res: any = await request({
                    url: `/api/v2/auth/wechat-login/`,
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
        <div style={{ padding: 20 }}>
            <h3>Hello Strava</h3>
        </div>
    );
};

export default WxAuthCallback;
