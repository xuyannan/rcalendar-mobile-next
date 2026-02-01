export const STORAGE_USER_TOKEN = 'rc-user-token';
export const STORAGE_USER_REFRESH_TOKEN = 'rc-user-refresh-token';
export const APP_ID = 'wxaaa01913df6abce5';
export const APP_SECRET = '9154924de94ef90c5f0121333e7995a3';
export const WX_LOGIN_CALLBACK = 'https://m.run365.info/wx_auth_callback';
export const WX_LOGIN_URL = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APP_ID}&redirect_uri=${encodeURIComponent(WX_LOGIN_CALLBACK)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
export const STRAVA_APPID = 36543;

// 微信开放平台 - 网站应用扫码登录
export const WX_OPEN_APPID = ''; // 需要在微信开放平台创建网站应用后填入
export const WX_QRCODE_LOGIN_URL = `https://open.weixin.qq.com/connect/qrconnect?appid=${WX_OPEN_APPID}&redirect_uri=${encodeURIComponent('https://m.run365.info/wx_auth_callback')}&response_type=code&scope=snsapi_login&state=qrcode#wechat_redirect`;

// Garmin OAuth2 PKCE configuration
export const GARMIN_CLIENT_ID = '509fd6f7-1992-49b6-a712-b2551e0ea2c3';
export const GARMIN_REDIRECT_URI = 'https://m.run365.info/garmin_callback';
export const GARMIN_AUTH_URL = 'https://connect.garmin.cn/oauth2Confirm';

// Coros OAuth2 configuration
export const COROS_CLIENT_ID = 'ee69bfd79b1e489cbe12ac7cb197e8ae';
export const COROS_REDIRECT_URI = 'https://m.run365.info/coros_callback';
export const COROS_AUTH_URL = 'https://open.coros.com/oauth2/authorize';
