import React from 'react';
import coros from '../../assets/brands/coros.png';
import adidas from '../../assets/brands/adidas.png';
import outopia from '../../assets/brands/outopia.png';
import lululemon from '../../assets/brands/lululemon.png';
import on from '../../assets/brands/on.png';
import brooks from '../../assets/brands/brooks.png';
import acg from '../../assets/brands/acg.png';
import altra from '../../assets/brands/altra.png';
import skins from '../../assets/brands/skins.png';
import mitoq from '../../assets/brands/mitoq.png';
import ag1 from '../../assets/brands/ag1.png';

const Brands: React.FC = () => {
  const brands = [
    { name: 'coros', logo: coros },
    { name: 'adidas', logo: adidas },
    { name: 'outopia', logo: outopia },
    { name: 'lululemon', logo: lululemon },
    { name: 'on', logo: on },
    { name: 'brooks', logo: brooks },
    { name: 'acg', logo: acg },
    { name: 'altra', logo: altra },
    { name: 'skins', logo: skins },
    { name: 'mitoq', logo: mitoq },
    { name: 'ag1', logo: ag1 },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', background: '#fff' }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' }}>合作伙伴</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {brands.map((brand, index) => (
          <div key={index} style={{ width: '50%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
            <img
              src={brand.logo}
              alt={brand.name}
              style={{ width: 60, height: 60, objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Brands;
