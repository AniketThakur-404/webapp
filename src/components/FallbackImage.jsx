import React, { useEffect, useState } from 'react';

const FallbackImage = ({ src, alt, className, fallbackSrc = '/placeholder.svg', ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() =>
        setCurrentSrc((prev) => (prev === fallbackSrc ? prev : fallbackSrc))
      }
      {...props}
    />
  );
};

export default FallbackImage;
