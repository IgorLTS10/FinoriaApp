import { useState } from "react";
import { useUser } from "@stackframe/react";
import styles from "./Crowdfunding.module.css";
import { useCrowdfunding, type CrowdfundingProject } from "./hooks/useCrowdfunding";
import { usePlatforms } from "./hooks/usePlatforms";
import ProjectCard from "./components/ProjectCard";
import AddProjectModal from "./components/AddProjectModal";
import TransactionsModal from "./components/TransactionsModal";
import ProjectDetailsModal from "./components/ProjectDetailsModal";
import DividendsChart from "./components/DividendsChart";
import BulkDividendModal from "./components/BulkDividendModal";



export default function Crowdfunding() {
    const user = useUser();
    const userId = (user as any)?.id as string | undefined;

    const { projects, loading, error, addProject, addTransaction, updateProject, deleteTransaction } = useCrowdfunding(userId);

    // Fetch platforms for dynamic colors
    const { platforms } = usePlatforms(userId);

    // Create color map from platforms
    const platformColors: Record<string, string> = {};
    platforms.forEach(p => {
        platformColors[p.name] = p.color;
    });

    const getPlatformColor = (platform: string | undefined): string => {
        if (!platform) return "#6b7280"; // Default gray if platform is undefined
        return platformColors[platform] || "#6b7280"; // Default gray if not found
    };

    const [addProjectOpen, setAddProjectOpen] = useState(false);
    const [bulkDividendOpen, setBulkDividendOpen] = useState(false);
    const [transactionModal, setTransactionModal] = useState<{ open: boolean; projectId: string; projectName: string } | null>(null);
    const [detailsModal, setDetailsModal] = useState<CrowdfundingProject | null>(null);
    const [viewMode, setViewMode] = useState<"cards" | "table">("table"); // Default to table
    const [chartVisible, setChartVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [chartPeriod, setChartPeriod] = useState<"month" | "quarter" | "year">("month");
    const [chartStartDate, setChartStartDate] = useState("");
    const [chartEndDate, setChartEndDate] = useState("");
    const [sortField, setSortField] = useState<"name" | "platform" | "amountInvested" | "yieldPercent" | "received" | "refunded" | "status" | "progress">("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "finished">("all");
    const [platformFilter, setPlatformFilter] = useState<string>("all");
    const itemsPerPage = 20;

    // Get unique platforms for filter
    const uniquePlatforms = Array.from(new Set((projects || []).map(p => p.platform).filter(Boolean)));

    // Filtrer et trier les projets
    const filteredProjects = (projects || [])
        .filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.platform || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || p.status === statusFilter;
            const matchesPlatform = platformFilter === "all" || p.platform === platformFilter;
            return matchesSearch && matchesStatus && matchesPlatform;
        })
        .sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case "name":
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case "platform":
                    aValue = a.platform.toLowerCase();
                    bValue = b.platform.toLowerCase();
                    break;
                case "amountInvested":
                    aValue = a.amountInvested;
                    bValue = b.amountInvested;
                    break;
                case "yieldPercent":
                    aValue = a.yieldPercent;
                    bValue = b.yieldPercent;
                    break;
                case "received":
                    aValue = a.received;
                    bValue = b.received;
                    break;
                case "refunded":
                    aValue = a.refunded;
                    bValue = b.refunded;
                    break;
                case "status":
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case "progress":
                    const startA = new Date(a.startDate);
                    const endA = new Date(startA);
                    endA.setMonth(startA.getMonth() + a.durationMonths);
                    const now = new Date();
                    const totalDurationA = endA.getTime() - startA.getTime();
                    const elapsedA = now.getTime() - startA.getTime();
                    aValue = Math.min(100, Math.max(0, (elapsedA / totalDurationA) * 100));

                    const startB = new Date(b.startDate);
                    const endB = new Date(startB);
                    endB.setMonth(startB.getMonth() + b.durationMonths);
                    const totalDurationB = endB.getTime() - startB.getTime();
                    const elapsedB = now.getTime() - startB.getTime();
                    bValue = Math.min(100, Math.max(0, (elapsedB / totalDurationB) * 100));
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

    // Pagination pour le tableau
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    // Réinitialiser la page quand la recherche change
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Séparer projets actifs et terminés (pour la vue cards)
    const activeProjects = filteredProjects.filter((p) => p.status === "active");
    const finishedProjects = filteredProjects.filter((p) => p.status === "finished");

    const handleCloseProject = async (project: CrowdfundingProject) => {
        if (!confirm(`Êtes-vous sûr de vouloir clôturer le projet "${project.name}" ?`)) {
            return;
        }
        try {
            await updateProject(project.id, userId!, { status: "finished" });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleToggleStatus = async (project: CrowdfundingProject) => {
        const newStatus = project.status === "active" ? "finished" : "active";
        const message = newStatus === "finished"
            ? `Clôturer le projet "${project.name}" ?`
            : `Réactiver le projet "${project.name}" ?`;

        if (!confirm(message)) return;

        try {
            await updateProject(project.id, userId!, { status: newStatus });
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Calculs globaux
    const totalInvested = (projects || []).reduce((sum, p) => sum + p.amountInvested, 0);
    const totalReceived = (projects || []).reduce((sum, p) => sum + p.received, 0);
    const totalRefunded = (projects || []).reduce((sum, p) => sum + p.refunded, 0);
    const activeProjectsCount = (projects || []).filter(p => p.status === "active").length;

    // Render sort icon
    const renderSortIcon = (field: typeof sortField) => {
        if (sortField !== field) return " ⇅";
        return sortDirection === "asc" ? " ↑" : " ↓";
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Crowdfunding</h1>
                    <p className={styles.subtitle}>Gérez vos investissements participatifs</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === "cards" ? styles.active : ""}`}
                            onClick={() => setViewMode("cards")}
                        >
                            📊 Cards
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === "table" ? styles.active : ""}`}
                            onClick={() => setViewMode("table")}
                        >
                            📋 Tableau
                        </button>
                    </div>
                    <button className={styles.addButton} onClick={() => setAddProjectOpen(true)}>
                        + Nouveau projet
                    </button>
                    <button className={styles.bulkButton} onClick={() => setBulkDividendOpen(true)}>
                        📊 Dividendes en masse
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total Investi</div>
                    <div className={styles.kpiValue}>{totalInvested.toLocaleString("fr-FR")} €</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total Reçu (Intérêts)</div>
                    <div className={`${styles.kpiValue} ${styles.green}`}>+{totalReceived.toLocaleString("fr-FR")} €</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total Remboursé</div>
                    <div className={styles.kpiValue}>{totalRefunded.toLocaleString("fr-FR")} €</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Projets Actifs</div>
                    <div className={styles.kpiValue}>{activeProjectsCount}</div>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* Collapsible Chart */}
            {projects && projects.length > 0 && (
                <div className={styles.chartSection}>
                    <div className={styles.chartHeader}>
                        <button onClick={() => setChartVisible(!chartVisible)} className={styles.chartToggle}>
                            {chartVisible ? "▼" : "▶"} Graphique des dividendes
                        </button>
                        {chartVisible && (
                            <div className={styles.chartFiltersContainer}>
                                {/* Filtres de période */}
                                <div className={styles.periodFilters}>
                                    <span className={styles.filterLabel}>Période :</span>
                                    <div className={styles.chartFilters}>
                                        <button
                                            className={`${styles.filterBtn} ${chartPeriod === "month" ? styles.active : ""}`}
                                            onClick={() => setChartPeriod("month")}
                                        >
                                            📅 Mois
                                        </button>
                                        <button
                                            className={`${styles.filterBtn} ${chartPeriod === "quarter" ? styles.active : ""}`}
                                            onClick={() => setChartPeriod("quarter")}
                                        >
                                            📊 Trimestre
                                        </button>
                                        <button
                                            className={`${styles.filterBtn} ${chartPeriod === "year" ? styles.active : ""}`}
                                            onClick={() => setChartPeriod("year")}
                                        >
                                            📈 Année
                                        </button>
                                    </div>
                                </div>

                                {/* Filtres de date */}
                                <div className={styles.dateFilters}>
                                    <span className={styles.filterLabel}>Plage :</span>
                                    <div className={styles.dateInputs}>
                                        <input
                                            type="date"
                                            value={chartStartDate}
                                            onChange={(e) => setChartStartDate(e.target.value)}
                                            className={styles.dateInput}
                                            placeholder="Début"
                                        />
                                        <span className={styles.dateSeparator}>→</span>
                                        <input
                                            type="date"
                                            value={chartEndDate}
                                            onChange={(e) => setChartEndDate(e.target.value)}
                                            className={styles.dateInput}
                                            placeholder="Fin"
                                        />
                                        {(chartStartDate || chartEndDate) && (
                                            <button
                                                onClick={() => {
                                                    setChartStartDate("");
                                                    setChartEndDate("");
                                                }}
                                                className={styles.clearDateBtn}
                                                title="Réinitialiser les dates"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {chartVisible && (
                        <DividendsChart
                            projects={projects}
                            period={chartPeriod}
                            startDate={chartStartDate}
                            endDate={chartEndDate}
                            platformColors={platformColors}
                        />
                    )}
                </div>
            )}

            {/* Search Bar and Filters for Table View */}
            {viewMode === "table" && (
                <div className={styles.tableFilters}>
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou plateforme..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className={styles.searchInput}
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as any);
                            setCurrentPage(1);
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">En cours</option>
                        <option value="finished">Terminés</option>
                    </select>
                    <select
                        value={platformFilter}
                        onChange={(e) => {
                            setPlatformFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="all">Toutes les plateformes</option>
                        {uniquePlatforms.map(platform => (
                            <option key={platform} value={platform}>{platform}</option>
                        ))}
                    </select>
                </div>
            )}

            {loading && (!projects || projects.length === 0) ? (
                <div className={styles.loading}>Chargement...</div>
            ) : (
                <>
                    {viewMode === "cards" ? (
                        <>
                            {/* Active Projects */}
                            {activeProjects.length > 0 && (
                                <>
                                    <h2 className={styles.sectionTitle}>Projets actifs</h2>
                                    <div className={styles.grid}>
                                        {activeProjects.map((project) => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                onAddTransaction={() => setTransactionModal({ open: true, projectId: project.id, projectName: project.name })}
                                                onViewDetails={() => setDetailsModal(project)}
                                                onCloseProject={() => handleCloseProject(project)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Finished Projects */}
                            {finishedProjects.length > 0 && (
                                <>
                                    <h2 className={styles.sectionTitle}>Projets terminés</h2>
                                    <div className={styles.grid}>
                                        {finishedProjects.map((project) => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                onAddTransaction={() => setTransactionModal({ open: true, projectId: project.id, projectName: project.name })}
                                                onViewDetails={() => setDetailsModal(project)}
                                                onCloseProject={() => handleCloseProject(project)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {(!projects || projects.length === 0) && !loading && (
                                <div className={styles.emptyState}>
                                    <p>Aucun projet pour le moment.</p>
                                    <button onClick={() => setAddProjectOpen(true)}>Commencer</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                                            Nom{renderSortIcon("name")}
                                        </th>
                                        <th onClick={() => handleSort("platform")} style={{ cursor: "pointer" }}>
                                            Plateforme{renderSortIcon("platform")}
                                        </th>
                                        <th onClick={() => handleSort("amountInvested")} style={{ cursor: "pointer" }}>
                                            Investi{renderSortIcon("amountInvested")}
                                        </th>
                                        <th onClick={() => handleSort("yieldPercent")} style={{ cursor: "pointer" }}>
                                            Rendement{renderSortIcon("yieldPercent")}
                                        </th>
                                        <th onClick={() => handleSort("received")} style={{ cursor: "pointer" }}>
                                            Reçu{renderSortIcon("received")}
                                        </th>
                                        <th onClick={() => handleSort("refunded")} style={{ cursor: "pointer" }}>
                                            Remboursé{renderSortIcon("refunded")}
                                        </th>
                                        <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                                            Statut{renderSortIcon("status")}
                                        </th>
                                        <th onClick={() => handleSort("progress")} style={{ cursor: "pointer" }}>
                                            Progression{renderSortIcon("progress")}
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProjects.map((project) => {
                                        const start = new Date(project.startDate);
                                        const end = new Date(start);
                                        end.setMonth(start.getMonth() + project.durationMonths);
                                        const now = new Date();
                                        const totalDuration = end.getTime() - start.getTime();
                                        const elapsed = now.getTime() - start.getTime();
                                        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                                        // Vérifier si un dividende a été reçu ce mois
                                        const currentMonth = now.getMonth();
                                        const currentYear = now.getFullYear();
                                        const hasDividendThisMonth = project.transactions.some((t) => {
                                            if (t.type !== "dividend") return false;
                                            const txDate = new Date(t.date);
                                            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
                                        });
                                        const needsAlert = project.status === "active" && !hasDividendThisMonth;

                                        // Calcul du pourcentage de dividendes
                                        const totalExpected = project.amountInvested * (project.yieldPercent / 100) * (project.durationMonths / 12);
                                        const dividendPercent = totalExpected > 0 ? ((project.received / totalExpected) * 100).toFixed(1) : "0";

                                        return (
                                            <tr key={project.id}>
                                                <td>
                                                    {needsAlert && (
                                                        <span className={styles.tableAlertIcon} title="Aucun dividende reçu ce mois">
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{project.name}</td>
                                                <td>
                                                    <span
                                                        className={styles.platformBadge}
                                                        style={{
                                                            backgroundColor: `${getPlatformColor(project.platform)}33`,
                                                            color: getPlatformColor(project.platform),
                                                            border: `1px solid ${getPlatformColor(project.platform)}66`
                                                        }}
                                                    >
                                                        {project.platform}
                                                    </span>
                                                </td>
                                                <td>{project.amountInvested.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                                                <td>{project.yieldPercent}%</td>
                                                <td className={styles.green}>
                                                    +{project.received.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                    <span className={styles.dividendPercent}> ({dividendPercent}%)</span>
                                                </td>
                                                <td>{project.refunded.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                                                <td>
                                                    <span
                                                        className={`${styles.statusBadge} ${styles[project.status]} ${styles.clickable}`}
                                                        onClick={() => handleToggleStatus(project)}
                                                        title="Cliquer pour changer le statut"
                                                    >
                                                        {project.status === "active" ? "En cours" : "Terminé"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.progressCell}>
                                                        <span>{Math.round(progress)}%</span>
                                                        <div className={styles.miniProgressBar}>
                                                            <div className={styles.miniProgressFill} style={{ width: `${progress}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.tableActions}>
                                                        <button onClick={() => setDetailsModal(project)} className={styles.tableBtn}>
                                                            👁️
                                                        </button>
                                                        <button onClick={() => setTransactionModal({ open: true, projectId: project.id, projectName: project.name })} className={styles.tableBtn}>
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={styles.paginationBtn}
                                    >
                                        ← Précédent
                                    </button>
                                    <span className={styles.paginationInfo}>
                                        Page {currentPage} sur {totalPages} ({filteredProjects.length} projets)
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className={styles.paginationBtn}
                                    >
                                        Suivant →
                                    </button>
                                </div>
                            )}

                            {(!projects || projects.length === 0) && !loading && (
                                <div className={styles.emptyState}>
                                    <p>Aucun projet pour le moment.</p>
                                    <button onClick={() => setAddProjectOpen(true)}>Commencer</button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {userId && (
                <>
                    <AddProjectModal
                        open={addProjectOpen}
                        onClose={() => setAddProjectOpen(false)}
                        onSubmit={addProject}
                        userId={userId}
                    />

                    {transactionModal && (
                        <TransactionsModal
                            open={transactionModal.open}
                            onClose={() => setTransactionModal(null)}
                            onSubmit={addTransaction}
                            projectId={transactionModal.projectId}
                            projectName={transactionModal.projectName}
                        />
                    )}

                    {detailsModal && (
                        <ProjectDetailsModal
                            open={true}
                            onClose={() => setDetailsModal(null)}
                            project={detailsModal}
                            userId={userId}
                            onUpdateProject={updateProject}
                            onDeleteTransaction={deleteTransaction}
                            onAddTransaction={() => {
                                setTransactionModal({ open: true, projectId: detailsModal.id, projectName: detailsModal.name });
                                setDetailsModal(null);
                            }}
                        />
                    )}
                </>
            )}
            <BulkDividendModal
                open={bulkDividendOpen}
                onClose={() => setBulkDividendOpen(false)}
                projects={projects || []}
                onSaveDividends={async (dividends) => {
                    // Save all dividends in batch
                    for (const dividend of dividends) {
                        await addTransaction({
                            projectId: dividend.projectId,
                            type: 'dividend',
                            amount: dividend.amount,
                            date: dividend.date
                        });
                    }
                }}
            />
        </div>
    );
}
