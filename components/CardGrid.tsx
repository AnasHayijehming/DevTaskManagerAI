

import React from 'react';
import { DevTaskCard as DevTaskCardType, Tag } from '../types';
import DevCard from './DevCard';

interface CardGridProps {
  cards: DevTaskCardType[];
  onCardSelect: (id: number) => void;
  tagsMap: Map<number, Tag>;
}

const CardGrid: React.FC<CardGridProps> = ({ cards, onCardSelect, tagsMap }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map(card => {
        const cardTags = (card.tagIds || []).map(id => tagsMap.get(id)).filter(Boolean) as Tag[];
        return <DevCard key={card.id} card={card} onSelect={() => onCardSelect(card.id)} tags={cardTags} />
      })}
    </div>
  );
};

export default CardGrid;
