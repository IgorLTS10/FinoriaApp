import { useState } from "react";
import { useUser } from "@stackframe/react";
import styles from "./Crowdfunding.module.css";
import { useCrowdfunding, type CrowdfundingProject } from "./hooks/useCrowdfunding";
import ProjectCard from "./components/ProjectCard";
import AddProjectModal from "./components/AddProjectModal";
import TransactionsModal from "./components/TransactionsModal";
import ProjectDetailsModal from "./components/ProjectDetailsModal";
import DividendsChart from "./components/DividendsChart";

// Couleurs par plateforme (mêmes que le graphique)
const PLATFORM_COLORS: Record<string, string> = {
    "Bricks": "#3b82f6",
    "Bienpreter": "#8b5cf6",
    "Anaxago": "#10b981",
    "Fundimmo": "#f59e0b",
    "Homunity": "#ef4444",
    "Raizers": "#ec4899",
};

const getPlatformColor = (platform: string): string => {
    return PLATFORM_COLORS[platform] || "#6b7280";
};

export default function Crowdfunding() {
    const user = useUser();
    const userId = (user as any)?.id as string | undefined;

    const { projects, loading, error, addProject, addTransaction, updateProject, deleteTransaction } = useCrowdfunding(userId);

    const [addProjectOpen, setAddProjectOpen] = useState(false);
    const [transactionModal, setTransactionModal] = useState<{ open: boolean; projectId: string; projectName: string } | null>(null);
    const [detailsModal, setDetailsModal] = useState<CrowdfundingProject | null>(null);
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
    const [chartVisible, setChartVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filtrer les projets selon la recherche
    const filteredProjects = (projects || []).filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.platform.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    // Séparer projets actifs et terminés
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

    // Calculs globaux
    const totalInvested = (projects || []).reduce((sum, p) => sum + p.amountInvested, 0);
    const totalReceived = (projects || []).reduce((sum, p) => sum + p.received, 0);
    const totalRefunded = (projects || []).reduce((sum, p) => sum + p.refunded, 0);
    const activeProjectsCount = (projects || []).filter(p => p.status === "active").length;

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
                    <button onClick={() => setChartVisible(!chartVisible)} className={styles.chartToggle}>
                        {chartVisible ? "▼" : "▶"} Graphique des dividendes
                    </button>
                    {chartVisible && <DividendsChart projects={projects} />}
                </div>
            )}

            {/* Search Bar for Table View */}
            {viewMode === "table" && (
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou plateforme..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className={styles.searchInput}
                    />
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
                                        <th>Nom</th>
                                        <th>Plateforme</th>
                                        <th>Investi</th>
                                        <th>Rendement</th>
                                        <th>Reçu</th>
                                        <th>Remboursé</th>
                                        <th>Statut</th>
                                        <th>Progression</th>
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

                                        return (
                                            <tr key={project.id}>
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
                                                <td>{project.amountInvested.toLocaleString("fr-FR")} €</td>
                                                <td>{project.yieldPercent}%</td>
                                                <td className={styles.green}>+{project.received.toLocaleString("fr-FR")} €</td>
                                                <td>{project.refunded.toLocaleString("fr-FR")} €</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[project.status]}`}>
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
        </div>
    );
}
