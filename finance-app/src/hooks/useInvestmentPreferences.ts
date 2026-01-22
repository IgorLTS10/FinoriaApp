import { useState, useEffect } from 'react';
import { INVESTMENT_CATEGORIES, DEFAULT_PREFERENCES } from '../config/investmentCategories';

export function useInvestmentPreferences(userId: string | null) {
    const [preferences, setPreferences] = useState<Record<string, boolean>>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            console.log('[useInvestmentPreferences] No userId, using defaults');
            setLoading(false);
            return;
        }

        async function loadPreferences() {
            try {
                const res = await fetch('/api/user/preferences', {
                    headers: {
                        'x-user-id': userId,
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
    }, [userId]);

    const savePreferences = async (newPreferences: Record<string, boolean>) => {
        console.log('[savePreferences] Called with:', newPreferences);
        console.log('[savePreferences] userId:', userId);

        if (!userId) {
            console.error('[savePreferences] NO USER ID - ABORTING');
            alert('Impossible de sauvegarder : utilisateur non identifié');
            return;
        }

        try {
            console.log('[savePreferences] Making API call...');
            const res = await fetch('/api/user/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                body: JSON.stringify({ preferences: newPreferences }),
            });

            console.log('[savePreferences] Response status:', res.status);

            if (!res.ok) {
                throw new Error('Failed to save preferences');
            }

            const data = await res.json();
            console.log('[savePreferences] Response data:', data);

            setPreferences(newPreferences);
            setError(null);
            console.log('[savePreferences] SUCCESS');
        } catch (err: any) {
            console.error('[savePreferences] Error:', err);
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
