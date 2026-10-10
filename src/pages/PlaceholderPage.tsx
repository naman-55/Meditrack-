import React from 'react';
import { Info } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  message: string;
}

export default function PlaceholderPage({ title, message }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <Info className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">{message}</p>
    </div>
  );
}
