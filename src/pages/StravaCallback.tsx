import React, { useEffect, useState } from 'react';
import { Result, Button, SpinLoading } from 'antd-mobile';
import { CloseCircleFill, CheckCircleFill } from 'antd-mobile-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import request from '../utils/request';

const StravaCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const code = searchParams.get('code');
        const scope = searchParams.get('scope');

        const bind = async () => {
             setLoading(true);
             try {
                const res: any = await request({
                    url: `/api/v1/m/strava_auth`,
                    method: 'POST',
                    data: { code, scope }
                });
                if (res.errors) {
                    setError(res.errors);
                } else {
                    setSuccess(true);
                }
             } catch (e) {
                 setError(e);
             } finally {
                 setLoading(false);
             }
        }

        if (code) {
            bind();
        }
    }, [searchParams]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                <SpinLoading color='primary' />
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ padding: 20 }}>
                <Result
                    icon={<CloseCircleFill style={{ color: '#F13642', fontSize: 48 }} />}
                    status='error'
                    title="绑定失败"
                    description="操作失败，请稍后再试"
                />
                <Button block onClick={() => navigate('/bind_strava')}>重试</Button>
                <Button block color='primary' style={{ marginTop: 10 }} onClick={() => navigate('/user/bindDevice')}>返回设备绑定</Button>
            </div>
        )
    }

    if (success) {
        return (
             <div style={{ padding: 20 }}>
                <Result
                    icon={<CheckCircleFill style={{ color: '#1F90E6', fontSize: 48 }} />}
                    status='success'
                    title="绑定成功"
                    description="您已成功绑定 Strava 账号，您的运动记录会自动同步到跑者日历平台"
                />
                <Button block color='primary' onClick={() => navigate('/user/bindDevice')}>返回设备绑定</Button>
            </div>
        )
    }

    return null;
};

export default StravaCallback;
