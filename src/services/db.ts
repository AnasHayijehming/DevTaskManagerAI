
import Dexie, { Table } from 'dexie';
import { DevTaskCard, Status, DevTaskCardData, KnowledgeFile, Tag } from '../types';

export class DevTaskManagerDB extends Dexie {
  cards!: Table<DevTaskCard, number>;
  knowledgeFiles!: Table<KnowledgeFile, number>;
  tags!: Table<Tag, number>;

  constructor() {
    super('DevTaskManagerDB');
    // Dexie schemas are not additive. Each version must define the full schema
    // for all tables that exist in that version. This ensures migrations and
    // indexes are handled correctly.

    // Version 1: Initial schema
    // FIX: Cast `this` to Dexie to resolve issue where `version` method is not found on subclass.
    (this as Dexie).version(1).stores({
      cards: '++id, title, status, createdAt, updatedAt',
    });

    // Version 2: Adds knowledge base.
    // We redeclare the 'cards' table schema, adding an index for `knowledgeFileIds`,
    // and add the new 'knowledgeFiles' table.
    // FIX: Cast `this` to Dexie to resolve issue where `version` method is not found on subclass.
    (this as Dexie).version(2).stores({
      cards: '++id, title, status, createdAt, updatedAt, *knowledgeFileIds',
      knowledgeFiles: '++id, name, createdAt',
    }).upgrade(tx => {
      // This upgrade function runs for users upgrading from v1.
      // It adds the new `knowledgeFileIds` property to existing cards.
      return tx.table('cards').toCollection().modify(card => {
        if (card.knowledgeFileIds === undefined) {
          card.knowledgeFileIds = [];
        }
      });
    });

    // Version 3: Adds tags.
    // We redeclare all existing tables and add the new 'tags' table.
    // We also add an index for `tagIds` on the cards table for efficient queries.
    // FIX: Cast `this` to Dexie to resolve issue where `version` method is not found on subclass.
    (this as Dexie).version(3).stores({
      cards: '++id, title, status, createdAt, updatedAt, *knowledgeFileIds, *tagIds',
      knowledgeFiles: '++id, name, createdAt',
      tags: '++id, &name', // &name makes the name property unique
    }).upgrade(tx => {
      // This upgrade runs for users upgrading from v1 or v2.
      // It adds the `tagIds` property to existing cards.
      return tx.table('cards').toCollection().modify(card => {
        if (card.tagIds === undefined) {
          card.tagIds = [];
        }
      });
    });
  }
}

export const db = new DevTaskManagerDB();


export const addCard = async (title: string): Promise<number> => {
  const newCard: Omit<DevTaskCard, 'id'> = {
    title,
    status: Status.Todo,
    requirement: '',
    referenceLink: '',
    spec: '',
    preDevAnalysis: {
      introduction: '',
      impactAnalysis: '',
      howToCode: '',
      testApproach: '',
    },
    testCases: [],
    requirementChatHistory: [],
    knowledgeFileIds: [],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return await db.cards.add(newCard as DevTaskCard);
};

export const updateCard = async (id: number, data: Partial<DevTaskCardData>): Promise<void> => {
    await db.cards.update(id, {...data, updatedAt: new Date()});
};

export const deleteCard = async (id: number): Promise<void> => {
  await db.cards.delete(id);
};

// --- RAG: KNOWLEDGE BASE FUNCTIONS ---

export const addKnowledgeFile = async (name: string, content: string): Promise<number> => {
    const newFile: Omit<KnowledgeFile, 'id'> = {
        name,
        content,
        createdAt: new Date()
    };
    return await db.knowledgeFiles.add(newFile as KnowledgeFile);
};

export const deleteKnowledgeFile = async (id: number): Promise<void> => {
    // Also remove this file ID from any cards that reference it to maintain data integrity
    const cardsToUpdate = await db.cards.where('knowledgeFileIds').equals(id).toArray();
    for (const card of cardsToUpdate) {
        const updatedIds = card.knowledgeFileIds.filter(fileId => fileId !== id);
        await db.cards.update(card.id, { knowledgeFileIds: updatedIds, updatedAt: new Date() });
    }
    await db.knowledgeFiles.delete(id);
};

// --- TAG MANAGEMENT FUNCTIONS ---

export const addTag = async (name: string, color: string): Promise<number> => {
    const newTag: Omit<Tag, 'id'> = { name, color };
    return await db.tags.add(newTag as Tag);
};

export const deleteTag = async (id: number): Promise<void> => {
    // Remove this tag ID from any cards that reference it to maintain data integrity
    const cardsToUpdate = await db.cards.where('tagIds').equals(id).toArray();
    for (const card of cardsToUpdate) {
        const updatedIds = card.tagIds.filter(tagId => tagId !== id);
        await db.cards.update(card.id, { tagIds: updatedIds, updatedAt: new Date() });
    }
    await db.tags.delete(id);
};
