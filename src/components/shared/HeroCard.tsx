import { type ReactNode } from 'react';
import { perfectCardShadow } from '../../lib/utils';

interface HeroCardProps {
  children: ReactNode;
  className?: string;
}

const HeroCard: React.FC<HeroCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`rounded-3xl p-6 ${className}`}
      style={{
        boxShadow: perfectCardShadow,
        borderRadius: '24px',
        backgroundColor: 'rgb(109, 40, 217)', // Bold accent bg (purple-700)
        color: 'white',
        padding: '1.5rem',
      }}
    >
      {children}
    </div>
  );
};

export default HeroCard;
