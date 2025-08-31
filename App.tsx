import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addCard, updateCard, deleteCard } from './services/db';
import { DevTaskCard, Status, DevTaskCardData, Tag } from './types';
import Header from './components/Header';
import CardGrid from './components/CardGrid';
import CardDetailModal from './components/CardDetailModal';
import KnowledgeBaseModal from './components/KnowledgeBaseModal';
import { WelcomePlaceholder } from './components/WelcomePlaceholder';
import SettingsModal from './components/SettingsModal';


const App: React.FC = () => {
  const [filter, setFilter] = useState<Status | 'All'>('All');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isKnowledgeBaseModalOpen, setKnowledgeBaseModalOpen] = useState(false);
  
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'api-key' | 'tags'>('api-key');

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

  const handleOpenSettingsModal = (tab: 'api-key' | 'tags') => {
    setSettingsInitialTab(tab);
    setSettingsModalOpen(true);
  };

  return (
    <div className="min-h-screen font-sans">
      <Header
        currentFilter={filter}
        onFilterChange={setFilter}
        onAddNewCard={handleAddNewCard}
        onKnowledgeBaseClick={() => setKnowledgeBaseModalOpen(true)}
        onSettingsClick={() => handleOpenSettingsModal('api-key')}
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
          onOpenSettingsModal={handleOpenSettingsModal}
        />
      )}
      {isKnowledgeBaseModalOpen && (
        <KnowledgeBaseModal onClose={() => setKnowledgeBaseModalOpen(false)} />
      )}
      {isSettingsModalOpen && (
        <SettingsModal 
          onClose={() => setSettingsModalOpen(false)} 
          initialTab={settingsInitialTab}
        />
      )}
    </div>
  );
};

export default App;