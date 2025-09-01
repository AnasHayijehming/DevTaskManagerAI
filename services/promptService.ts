import { DEFAULT_PROMPTS, PROMPTS_STORAGE_KEY } from '../constants/prompts';

export const getPrompts = (): typeof DEFAULT_PROMPTS => {
    try {
        const storedPrompts = localStorage.getItem(PROMPTS_STORAGE_KEY);
        if (storedPrompts) {
            return { ...DEFAULT_PROMPTS, ...JSON.parse(storedPrompts) };
        }
    } catch (e) {
        console.error("Could not access localStorage for prompts", e);
    }
    return DEFAULT_PROMPTS;
};
