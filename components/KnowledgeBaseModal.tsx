import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addKnowledgeFile, deleteKnowledgeFile } from '../services/db';
import { TrashIcon, XMarkIcon, PlusIcon, DocumentTextIcon } from './icons/Icons';
import Spinner from './Spinner';

interface KnowledgeBaseModalProps {
  onClose: () => void;
}

const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ onClose }) => {
  const knowledgeFiles = useLiveQuery(() => db.knowledgeFiles.orderBy('createdAt').reverse().toArray(), []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert(`File "${file.name}" is too large. The maximum size is 5MB.`);
            continue;
        }
        const content = await file.text();
        await addKnowledgeFile(file.name, content);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("There was an error uploading one or more files. Please check the console.");
    } finally {
      setIsUploading(false);
      // Reset the file input to allow re-uploading the same file
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this file from the knowledge base? This will also un-link it from any cards.")) {
      await deleteKnowledgeFile(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Knowledge Base</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200" aria-label="Close">
            <XMarkIcon className="w-6 h-6 text-slate-600" />
          </button>
        </header>
        
        <main className="flex-grow p-6 overflow-y-auto">
          <div className="mb-6">
            <label htmlFor="file-upload" className="w-full cursor-pointer">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                {isUploading ? (
                  <>
                    <Spinner />
                    <span className="mt-2 text-sm font-semibold text-slate-700">Uploading...</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-8 h-8 text-slate-400 mb-2"/>
                    <span className="text-sm font-semibold text-slate-700">Click to upload files</span>
                    <span className="text-xs text-slate-500 mt-1">.txt, .md, .json, etc. (Max 5MB per file)</span>
                  </>
                )}
              </div>
            </label>
            <input 
              id="file-upload"
              ref={fileInputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".txt,.md,.json,.html,.css,.js,.ts,.py,.java,.c,.cpp,.cs,.go,.php,.rb,.rs,.swift,.kt,.sql"
            />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Uploaded Files</h3>
          <div className="space-y-3">
            {!knowledgeFiles ? (
                <div className="text-center py-8">
                    <Spinner />
                </div>
            ) : knowledgeFiles.length > 0 ? (
              knowledgeFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <DocumentTextIcon className="w-6 h-6 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded on {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(file.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" aria-label={`Delete ${file.name}`}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Your knowledge base is empty. Upload some files to get started.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;