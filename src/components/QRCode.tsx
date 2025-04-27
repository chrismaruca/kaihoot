import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  includeMargin?: boolean;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
}

const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 128,
  includeMargin = true,
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'L',
  className,
}) => {
  return (
    <div className={className}>
      <QRCodeSVG
        value={value}
        size={size}
      />
    </div>
  );
};

export default QRCode;