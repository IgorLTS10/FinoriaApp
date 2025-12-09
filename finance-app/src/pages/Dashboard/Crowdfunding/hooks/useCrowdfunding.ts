import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export type Transaction = {
    id: string;
    projectId: string;
    type: "dividend" | "refund";
    amount: number;
    date: string;
    createdAt: string;
};

export type CrowdfundingProject = {
    id: string;
    userId: string;
    name: string;
    platform: string;
    amountInvested: number;
    yieldPercent: number;
    startDate: string;
    durationMonths: number;
    status: "active" | "finished";
    imageUrl?: string;
    contractUrl?: string;
    createdAt: string;

    // Aggregated data
    received: number;
    refunded: number;
    transactions: Transaction[];
};

export type NewProjectPayload = {
    userId: string;
    name: string;
    platform: string;
    amountInvested: number;
    yieldPercent: number;
    startDate: string;
    durationMonths: number;
    imageUrl?: string;
    contractUrl?: string;
};

export type NewTransactionPayload = {
    projectId: string;
    type: "dividend" | "refund";
    amount: number;
    date: string;
};

export function useCrowdfunding(userId?: string) {
    const [projects, setProjects] = useState<CrowdfundingProject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`/api/crowdfunding/projects?userId=${userId}`);
            setProjects(res.data.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || "Erreur chargement projets");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const addProject = async (payload: NewProjectPayload) => {
        try {
            const res = await axios.post("/api/crowdfunding/projects", payload);
            // On recharge tout pour avoir l'état frais (ou on pourrait append manuellement)
            await fetchProjects();
            return res.data.project;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const addTransaction = async (payload: NewTransactionPayload) => {
        try {
            await axios.post("/api/crowdfunding/transactions", payload);
            await fetchProjects(); // Pour mettre à jour les totaux received/refunded
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            await axios.delete("/api/crowdfunding/transactions", { data: { id } });
            await fetchProjects();
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const updateProject = async (id: string, userId: string, updates: any) => {
        try {
            await axios.patch("/api/crowdfunding/projects", { id, userId, ...updates });
            await fetchProjects();
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const updateTransaction = async (id: string, updates: Partial<NewTransactionPayload>) => {
        try {
            await axios.patch("/api/crowdfunding/transactions", { id, ...updates });
            await fetchProjects();
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return {
        projects,
        loading,
        error,
        addProject,
        addTransaction,
        deleteTransaction,
        updateProject,
        updateTransaction,
        refresh: fetchProjects,
    };
}
