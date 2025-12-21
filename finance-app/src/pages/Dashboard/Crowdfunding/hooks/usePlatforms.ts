// Hook for managing crowdfunding platforms
import { useState, useEffect, useCallback } from "react";

export type Platform = {
    id: string;
    name: string;
    color: string;
    isFavorite?: boolean;
    createdAt: string;
    createdBy: string | null;
};

export function usePlatforms(userId?: string) {
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch platforms
    const fetchPlatforms = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const headers: HeadersInit = {};
            if (userId) {
                headers["x-user-id"] = userId;
            }

            const res = await fetch("/api/crowdfunding/platforms", { headers });

            if (!res.ok) {
                throw new Error("Failed to fetch platforms");
            }

            const data = await res.json();
            setPlatforms(data.platforms || []);
        } catch (err: any) {
            console.error("Error fetching platforms:", err);
            setError(err.message || "Failed to load platforms");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Create new platform
    const createPlatform = useCallback(async (name: string): Promise<Platform> => {
        if (!userId) {
            throw new Error("User must be authenticated to create platforms");
        }

        const res = await fetch("/api/crowdfunding/platforms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": userId,
            },
            body: JSON.stringify({ name }),
        });

        if (!res.ok) {
            const data = await res.json();

            // If platform already exists, return it
            if (res.status === 409 && data.platform) {
                return data.platform;
            }

            throw new Error(data.error || "Failed to create platform");
        }

        const data = await res.json();
        const newPlatform = data.platform;

        // Add to local state
        setPlatforms(prev => [newPlatform, ...prev]);

        return newPlatform;
    }, [userId]);

    // Toggle favorite
    const toggleFavorite = useCallback(async (platformId: string) => {
        if (!userId) {
            throw new Error("User must be authenticated to favorite platforms");
        }

        const res = await fetch(`/api/crowdfunding/platforms/${platformId}/favorite`, {
            method: "POST",
            headers: {
                "x-user-id": userId,
            },
        });

        if (!res.ok) {
            throw new Error("Failed to toggle favorite");
        }

        const data = await res.json();
        const isFavorite = data.isFavorite;

        // Update local state
        setPlatforms(prev => {
            const updated = prev.map(p =>
                p.id === platformId ? { ...p, isFavorite } : p
            );

            // Re-sort: favorites first
            return updated.sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.name.localeCompare(b.name);
            });
        });

        return isFavorite;
    }, [userId]);

    // Load platforms on mount
    useEffect(() => {
        fetchPlatforms();
    }, [fetchPlatforms]);

    return {
        platforms,
        loading,
        error,
        createPlatform,
        toggleFavorite,
        refetch: fetchPlatforms,
    };
}
