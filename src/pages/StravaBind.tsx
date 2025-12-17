import React, { useEffect } from 'react';
import { Button } from 'antd-mobile';
import { STRAVA_APPID, STORAGE_USER_TOKEN, APP_ID, WX_LOGIN_CALLBACK } from '../constants';

const StravaBind: React.FC = () => {
    useEffect(() => {
        const token = localStorage.getItem(STORAGE_USER_TOKEN);
        if (!token) {
            window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APP_ID}&redirect_uri=${encodeURIComponent(WX_LOGIN_CALLBACK + '?redirect_to=/bind_strava')}&response_type=code&scope=snsapi_userinfo&state=STATE`
        }
    }, []);

    return (
        <div style={{ padding: 40 }}>
            <Button
                block
                color='warning'
                onClick={() => {
                    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_APPID}&response_type=code&redirect_uri=${encodeURIComponent('https://m.run365.info/strava_callback')}&approval_prompt=force&scope=activity:read_all`;
                }}
            >
                绑定 Strava
            </Button>
        </div>
    );
};

export default StravaBind;
