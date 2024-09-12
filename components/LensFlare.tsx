import React from 'react';

const LensFlare: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="lens-flare lens-flare-1"></div>
      <div className="lens-flare lens-flare-2"></div>
      <div className="lens-flare lens-flare-3"></div>
    </div>
  );
};

export default LensFlare;