import React from 'react';
import bg from '../../assets/background.jpg';
import logo from '../../assets/logo.png';

const Cover: React.FC = () => {
  return (
    <div style={{
      height: '100%',
      width: '100%',
      position: 'relative',
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Mask */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent black mask
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
         <div style={{
            position: 'absolute',
            top: '30%',
            right: '10%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
         }}>
            <img src={logo} alt="Logo" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 20 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                有料，有趣的跑步播客
            </div>
         </div>
      </div>
    </div>
  );
};

export default Cover;
