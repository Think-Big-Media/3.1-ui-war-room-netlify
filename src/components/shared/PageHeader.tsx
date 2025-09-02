import type React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-6 -mt-4">
      <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg leading-tight pl-4 fade-in">
        {title}
      </h1>
      <p className="text-base text-white/90 drop-shadow-sm font-light pl-4 fade-in">{subtitle}</p>
    </div>
  );
};

export default PageHeader;
