import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TestCase, TestCaseStatus } from '../types';
import { TEST_CASE_STATUS_COLORS } from '../constants';
import { PlusIcon, TrashIcon } from './icons/Icons';
import EditPreviewToggle from './EditPreviewToggle';
import Mermaid from './Mermaid';

interface TestCasesEditorProps {
  testCases: TestCase[];
  onChange: (testCases: TestCase[]) => void;
}

type ColumnViewMode = 'edit' | 'preview';
type ViewModes = {
    description: ColumnViewMode;
    input: ColumnViewMode;
    expectedResult: ColumnViewMode;
}

const markdownComponents = {
  code({node, inline, className, children, ...props}: any) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

const TestCasesEditor: React.FC<TestCasesEditorProps> = ({ testCases, onChange }) => {
    const [viewModes, setViewModes] = useState<ViewModes>({
        description: 'edit',
        input: 'edit',
        expectedResult: 'edit',
    });

    const handleViewModeChange = (column: keyof ViewModes, mode: ColumnViewMode) => {
        setViewModes(prev => ({...prev, [column]: mode}));
    };
  
    const handleAddTestCase = () => {
        const newTestCase: TestCase = {
        id: crypto.randomUUID(),
        description: '',
        input: '',
        expectedResult: '',
        status: TestCaseStatus.Pending,
        };
        onChange([...testCases, newTestCase]);
    };

    const handleUpdateTestCase = (id: string, field: keyof Omit<TestCase, 'id'>, value: string) => {
        const updatedTestCases = testCases.map(tc => 
        tc.id === id ? { ...tc, [field]: value } : tc
        );
        onChange(updatedTestCases);
    };
    
    const handleDeleteTestCase = (id: string) => {
        onChange(testCases.filter(tc => tc.id !== id));
    };
  
    const inputStyles = "w-full p-2 bg-white text-slate-800 border border-slate-300 rounded-md shadow-sm text-sm min-h-[60px] focus:ring-2 focus:ring-sky-500 focus:border-sky-500";
    const previewStyles = "prose prose-sm max-w-none p-2 min-h-[60px]";

    const renderCell = (tc: TestCase, field: keyof ViewModes) => {
        if (viewModes[field] === 'preview') {
        return (
            <div className={previewStyles}>
            {tc[field] ? <ReactMarkdown components={markdownComponents}>{tc[field]}</ReactMarkdown> : <p className="text-slate-500 italic">Not specified.</p>}
            </div>
        );
        }
        return (
        <textarea 
            value={tc[field]} 
            onChange={e => handleUpdateTestCase(tc.id, field, e.target.value)} 
            className={inputStyles}
        />
        );
    };
  
    const renderHeader = (label: string, field: keyof ViewModes) => (
        <th scope="col" className="px-4 py-3 w-3/12">
            <div className="flex justify-between items-center">
                <span>{label}</span>
                <EditPreviewToggle 
                    viewMode={viewModes[field]}
                    onViewModeChange={(mode) => handleViewModeChange(field, mode)}
                />
            </div>
        </th>
    );
  
    return (
        <div className="space-y-4">
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                <table className="w-full min-w-[800px] text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-1/12">ID</th>
                            {renderHeader('Description', 'description')}
                            {renderHeader('Input', 'input')}
                            {renderHeader('Expected Result', 'expectedResult')}
                            <th scope="col" className="px-4 py-3 w-1/12">Status</th>
                            <th scope="col" className="px-4 py-3 w-1/12">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {testCases.map((tc, index) => (
                            <tr key={tc.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-900">{index + 1}</td>
                                <td className="px-4 py-2">
                                    {renderCell(tc, 'description')}
                                </td>
                                <td className="px-4 py-2">
                                    {renderCell(tc, 'input')}
                                </td>
                                <td className="px-4 py-2">
                                    {renderCell(tc, 'expectedResult')}
                                </td>
                                <td className="px-4 py-2">
                                    <select 
                                        value={tc.status} 
                                        onChange={e => handleUpdateTestCase(tc.id, 'status', e.target.value)}
                                        className={`w-full p-1.5 rounded-md text-xs font-medium border border-slate-300 focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 focus:border-sky-500 bg-white shadow-sm`}
                                    >
                                        {Object.values(TestCaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={() => handleDeleteTestCase(tc.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-center">
                <button
                    onClick={handleAddTestCase}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                >
                    <PlusIcon className="w-5 h-5"/>
                    Add Test Case
                </button>
            </div>
        </div>
    );
};

export default TestCasesEditor;
