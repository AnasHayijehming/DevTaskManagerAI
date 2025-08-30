import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addCard, updateCard, deleteCard, addTag, deleteTag } from './services/db';
import { DevTaskCard, Status, DevTaskCardData, Tag } from './types';
import Header from './components/Header';
import CardGrid from './components/CardGrid';
import CardDetailModal from './components/CardDetailModal';
import KnowledgeBaseModal from './components/KnowledgeBaseModal';
import { WelcomePlaceholder } from './components/WelcomePlaceholder';
import { TAG_COLORS, TAG_COLOR_CLASSES } from './constants';
import { XMarkIcon, TrashIcon } from './components/icons/Icons';


// --- Tag Management Modal Component ---
interface TagManagementModalProps {
  onClose: () => void;
}

const TagManagementModal: React.FC<TagManagementModalProps> = ({ onClose }) => {
  const tags = useLiveQuery(() => db.tags.orderBy('name').toArray(), []);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[10]); // default to sky

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await addTag(newTagName.trim(), selectedColor);
      setNewTagName('');
    } catch (error) {
      console.error("Failed to add tag:", error);
      alert(`Error adding tag. A tag with the name "${newTagName.trim()}" may already exist.`);
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this tag? It will be removed from all associated cards.")) {
      await deleteTag(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Manage Tags</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200" aria-label="Close">
            <XMarkIcon className="w-6 h-6 text-slate-600" />
          </button>
        </header>
        
        <form onSubmit={handleAddTag} className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="New tag name..."
              className="flex-grow px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              maxLength={25}
            />
            <button type="submit" className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-900 transition-colors">
              Add Tag
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map(color => (
              <button
                type="button"
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full transition-transform transform hover:scale-110 ${TAG_COLOR_CLASSES[color].bg} ${selectedColor === color ? 'ring-2 ring-offset-1 ring-sky-500' : ''}`}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </form>

        <main className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {tags && tags.length > 0 ? tags.map(tag => {
              const colorClasses = TAG_COLOR_CLASSES[tag.color] || TAG_COLOR_CLASSES.slate;
              return (
                <span key={tag.id} className={`inline-flex items-center font-medium rounded-full whitespace-nowrap text-sm px-2.5 py-1 ${colorClasses.bg} ${colorClasses.text}`}>
                  {tag.name}
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className={`ml-1.5 -mr-1 p-0.5 rounded-full ${colorClasses.hoverBg} ${colorClasses.hoverText}`}
                    aria-label={`Remove tag ${tag.name}`}
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </span>
              );
            }) : (
              <p className="text-slate-500 text-sm">No tags created yet. Add one above!</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [filter, setFilter] = useState<Status | 'All'>('All');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isKnowledgeBaseModalOpen, setKnowledgeBaseModalOpen] = useState(false);
  const [isTagManagementModalOpen, setTagManagementModalOpen] = useState(false);

  const cards = useLiveQuery(() => db.cards.toArray(), []);
  const tags = useLiveQuery(() => db.tags.toArray(), []);

  const tagsMap = useMemo(() => {
    if (!tags) return new Map<number, Tag>();
    return new Map(tags.map(tag => [tag.id, tag]));
  }, [tags]);


  const filteredCards = useMemo(() => {
    if (!cards) return [];
    if (filter === 'All') return cards;
    return cards.filter(card => card.status === filter);
  }, [cards, filter]);

  const selectedCard = useMemo(() => {
    if (!selectedCardId || !cards) return null;
    return cards.find(card => card.id === selectedCardId) || null;
  }, [selectedCardId, cards]);

  const handleAddNewCard = async () => {
    const defaultTitle = `New Task - ${new Date().toLocaleString()}`;
    try {
      const newCardId = await addCard(defaultTitle);
      setSelectedCardId(newCardId);
    } catch (error) {
      console.error("Failed to add new card:", error);
      alert("There was an error creating a new card. Please check the developer console for more information.");
    }
  };

  const handleUpdateCard = async (id: number, data: Partial<DevTaskCardData>) => {
    await updateCard(id, data);
  };

  const handleDeleteCard = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this card? This action cannot be undone.")) {
      await deleteCard(id);
      setSelectedCardId(null);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <Header
        currentFilter={filter}
        onFilterChange={setFilter}
        onAddNewCard={handleAddNewCard}
        onKnowledgeBaseClick={() => setKnowledgeBaseModalOpen(true)}
        onManageTagsClick={() => setTagManagementModalOpen(true)}
      />
      <main className="p-4 sm:p-6 md:p-8">
        {cards && cards.length > 0 ? (
          <CardGrid cards={filteredCards} onCardSelect={setSelectedCardId} tagsMap={tagsMap} />
        ) : (
          <WelcomePlaceholder onAddNewCard={handleAddNewCard} />
        )}
      </main>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          allTags={tags || []}
        />
      )}
      {isKnowledgeBaseModalOpen && (
        <KnowledgeBaseModal onClose={() => setKnowledgeBaseModalOpen(false)} />
      )}
      {isTagManagementModalOpen && (
        <TagManagementModal onClose={() => setTagManagementModalOpen(false)} />
      )}
    </div>
  );
};

export default App;
