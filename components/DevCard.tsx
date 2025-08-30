import React from 'react';
import { DevTaskCard as DevTaskCardType, Tag } from '../types';
import { STATUS_PILL_CLASSES, STATUS_BORDER_CLASSES, STATUS_HOVER_BG_CLASSES, TAG_COLOR_CLASSES } from '../constants';
import { CalendarDaysIcon } from './icons/Icons';

interface DevCardProps {
  card: DevTaskCardType;
  onSelect: () => void;
  tags: Tag[];
}

const DevCard: React.FC<DevCardProps> = ({ card, onSelect, tags }) => {
  const statusPillClass = STATUS_PILL_CLASSES[card.status];
  const borderColorClass = STATUS_BORDER_CLASSES[card.status];
  const hoverBgClass = STATUS_HOVER_BG_CLASSES[card.status];

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-l-[5px] ${borderColorClass} ${hoverBgClass} overflow-hidden hover:-translate-y-1 flex flex-col`}
    >
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-slate-900 break-words w-full pr-2 mb-2">{card.title}</h3>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(tag => {
              const colorClasses = TAG_COLOR_CLASSES[tag.color] || TAG_COLOR_CLASSES.slate;
              return (
                <span key={tag.id} className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClasses.bg} ${colorClasses.text}`}>
                  {tag.name}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex justify-between items-center">
             <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDaysIcon className="w-4 h-4" />
                <span>{new Date(card.updatedAt).toLocaleDateString()}</span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${statusPillClass}`}>{card.status}</span>
        </div>
      </div>
    </div>
  );
};

export default DevCard;
