import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative';
  comingSoon?: boolean;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType,
  comingSoon 
}: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
      {comingSoon && (
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Soon</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{comingSoon ? '--' : value}</p>
          {change && !comingSoon && (
            <p className={`text-sm mt-1 ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <Icon size={24} className="text-gray-600" />
        </div>
      </div>
    </div>
  );
}