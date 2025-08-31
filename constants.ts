import { Status, TestCaseStatus } from './types';

export const STATUS_PILL_CLASSES: Record<Status, string> = {
  [Status.Todo]: 'bg-slate-200 text-slate-600',
  [Status.InProgress]: 'bg-amber-100 text-amber-600',
  [Status.Done]: 'bg-emerald-100 text-emerald-600',
};

export const STATUS_BORDER_CLASSES: Record<Status, string> = {
  [Status.Todo]: 'border-slate-500',
  [Status.InProgress]: 'border-amber-500',
  [Status.Done]: 'border-emerald-500',
};

export const STATUS_HOVER_BG_CLASSES: Record<Status, string> = {
  [Status.Todo]: 'hover:bg-slate-50',
  [Status.InProgress]: 'hover:bg-amber-50',
  [Status.Done]: 'hover:bg-emerald-50',
};


export const TEST_CASE_STATUS_COLORS: Record<TestCaseStatus, string> = {
  [TestCaseStatus.Pending]: 'bg-slate-200 text-slate-700',
  [TestCaseStatus.Pass]: 'bg-emerald-100 text-emerald-700',
  [TestCaseStatus.Fail]: 'bg-red-100 text-red-700',
};

export const TABS = ['Requirement & Spec', 'Pre-Dev', 'Test Cases', 'Markdown Preview'];

export const TAG_COLORS = [
    'slate', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

export const TAG_COLOR_CLASSES: Record<string, { bg: string, text: string, hoverBg: string, hoverText: string, border: string }> = {
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', hoverBg: 'hover:bg-slate-200', hoverText: 'hover:text-slate-800', border: 'border-slate-300' },
    red: { bg: 'bg-red-100', text: 'text-red-600', hoverBg: 'hover:bg-red-200', hoverText: 'hover:text-red-800', border: 'border-red-300' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', hoverBg: 'hover:bg-orange-200', hoverText: 'hover:text-orange-800', border: 'border-orange-300' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', hoverBg: 'hover:bg-amber-200', hoverText: 'hover:text-amber-800', border: 'border-amber-300' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', hoverBg: 'hover:bg-yellow-200', hoverText: 'hover:text-yellow-800', border: 'border-yellow-300' },
    lime: { bg: 'bg-lime-100', text: 'text-lime-600', hoverBg: 'hover:bg-lime-200', hoverText: 'hover:text-lime-800', border: 'border-lime-300' },
    green: { bg: 'bg-green-100', text: 'text-green-600', hoverBg: 'hover:bg-green-200', hoverText: 'hover:text-green-800', border: 'border-green-300' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', hoverBg: 'hover:bg-emerald-200', hoverText: 'hover:text-emerald-800', border: 'border-emerald-300' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', hoverBg: 'hover:bg-teal-200', hoverText: 'hover:text-teal-800', border: 'border-teal-300' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', hoverBg: 'hover:bg-cyan-200', hoverText: 'hover:text-cyan-800', border: 'border-cyan-300' },
    sky: { bg: 'bg-sky-100', text: 'text-sky-600', hoverBg: 'hover:bg-sky-200', hoverText: 'hover:text-sky-800', border: 'border-sky-300' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hoverBg: 'hover:bg-blue-200', hoverText: 'hover:text-blue-800', border: 'border-blue-300' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hoverBg: 'hover:bg-indigo-200', hoverText: 'hover:text-indigo-800', border: 'border-indigo-300' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', hoverBg: 'hover:bg-violet-200', hoverText: 'hover:text-violet-800', border: 'border-violet-300' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', hoverBg: 'hover:bg-purple-200', hoverText: 'hover:text-purple-800', border: 'border-purple-300' },
    fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', hoverBg: 'hover:bg-fuchsia-200', hoverText: 'hover:text-fuchsia-800', border: 'border-fuchsia-300' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', hoverBg: 'hover:bg-pink-200', hoverText: 'hover:text-pink-800', border: 'border-pink-300' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-600', hoverBg: 'hover:bg-rose-200', hoverText: 'hover:text-rose-800', border: 'border-rose-300' },
};

export const AVAILABLE_MODELS = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'The latest, fastest, and most capable model for general tasks.'
    }
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;