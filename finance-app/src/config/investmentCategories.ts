export interface InvestmentCategory {
    id: string;
    name: string;
    path: string;
    icon: string;
    status: 'green' | 'orange' | 'red';
}

export const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
    {
        id: 'actions',
        name: 'Actions',
        path: '/dashboard/actions',
        icon: '📈',
        status: 'orange',
    },
    {
        id: 'crypto',
        name: 'Crypto',
        path: '/dashboard/crypto',
        icon: '₿',
        status: 'green',
    },
    {
        id: 'etf',
        name: 'ETF',
        path: '/dashboard/etf',
        icon: '📊',
        status: 'red',
    },
    {
        id: 'crowdfunding',
        name: 'Crowdfunding',
        path: '/dashboard/crowdfunding',
        icon: '🤝',
        status: 'green',
    },
    {
        id: 'metaux',
        name: 'Métaux',
        path: '/dashboard/metaux',
        icon: '🥇',
        status: 'green',
    },
    {
        id: 'immobilier',
        name: 'Immobilier',
        path: '/dashboard/immobilier',
        icon: '🏠',
        status: 'red',
    },
];

// Valeurs par défaut (toutes activées)
export const DEFAULT_PREFERENCES: Record<string, boolean> = {
    actions: true,
    crypto: true,
    etf: true,
    crowdfunding: true,
    metaux: true,
    immobilier: true,
};
