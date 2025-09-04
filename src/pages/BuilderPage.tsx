/**
 * Builder.io Page Component
 * Renders pages created in Builder.io visual editor
 */

import React from 'react';
import { BuilderContent } from '../components/BuilderContent';

const BuilderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BuilderContent modelName="page" apiKey={import.meta.env.VITE_BUILDER_IO_KEY} />
    </div>
  );
};

export default BuilderPage;
