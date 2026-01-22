import { useState, useEffect } from 'react';
import { INVESTMENT_CATEGORIES, DEFAULT_PREFERENCES } from '../config/investmentCategories';

function getUserId(): string | null {
    try {
        const stackSession = localStorage.getItem('stack-session');
        if (stackSession) {
            const session = JSON.parse(stackSession);
            return session?.userId || null;
        }
    } catch (err) {
        console.warn('Could not get user ID:', err);
    }
    return null;
}

export function useInvestmentPreferences() {
    const [preferences, setPreferences] = useState<Record<string, boolean>>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const userId = getUserId();

        if (!userId) {
            setLoading(false);
            return;
        }

        async function loadPreferences() {
            try {
                const res = await fetch('/api/user/preferences', {
                    headers: {
                        'x-user-id': userId!,
                    },
                });

                if (!res.ok) {
                    throw new Error('Failed to load preferences');
                }

                const data = await res.json();
                setPreferences(data.preferences || DEFAULT_PREFERENCES);
            } catch (err: any) {
                console.error('Error loading preferences:', err);
                setError(err.message);
                setPreferences(DEFAULT_PREFERENCES);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, []);

    const savePreferences = async (newPreferences: Record<string, boolean>) => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const res = await fetch('/api/user/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                body: JSON.stringify({ preferences: newPreferences }),
            });

            if (!res.ok) {
                throw new Error('Failed to save preferences');
            }

            setPreferences(newPreferences);
            setError(null);
        } catch (err: any) {
            console.error('Error saving preferences:', err);
            setError(err.message);
            throw err;
        }
    };

    const enabledCategories = INVESTMENT_CATEGORIES.filter(
        (category) => preferences[category.id]
    );

    return {
        preferences,
        savePreferences,
        enabledCategories,
        loading,
        error,
    };
}
