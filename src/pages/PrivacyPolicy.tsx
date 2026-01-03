import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>隐私协议</h1>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>
                <p>欢迎使用本应用。我们非常重视您的隐私保护，请您在使用我们的服务前仔细阅读本隐私协议。</p>
                
                <h2 style={{ fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>一、信息收集</h2>
                <p>我们可能会收集以下信息：</p>
                <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    <li>您的账户信息（如用户名、头像等）</li>
                    <li>您的运动数据（如跑步记录、运动轨迹等）</li>
                    <li>设备信息（如设备型号、操作系统版本等）</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>二、信息使用</h2>
                <p>我们收集的信息将用于：</p>
                <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    <li>提供、维护和改进我们的服务</li>
                    <li>个性化您的使用体验</li>
                    <li>与您沟通，包括发送服务通知</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>三、信息保护</h2>
                <p>我们采取适当的安全措施来保护您的个人信息，防止未经授权的访问、使用或披露。</p>

                <h2 style={{ fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>四、信息共享</h2>
                <p>除非获得您的同意，我们不会与第三方共享您的个人信息，但以下情况除外：</p>
                <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    <li>法律法规要求</li>
                    <li>保护我们的合法权益</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>五、联系我们</h2>
                <p>如果您对本隐私协议有任何疑问，请联系我们。</p>

                <p style={{ marginTop: 24, color: '#999', fontSize: 12 }}>最后更新日期：2026年1月3日</p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
