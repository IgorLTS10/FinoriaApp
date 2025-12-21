import { useState, useRef, useEffect } from "react";
import styles from "./PlatformSelector.module.css";
import type { Platform } from "../hooks/usePlatforms";

type Props = {
    platforms: Platform[];
    selectedId: string;
    onSelect: (platformId: string) => void;
    onCreateNew: () => void;
    onToggleFavorite?: (platformId: string) => void;
    disabled?: boolean;
};

export default function PlatformSelector({ platforms, selectedId, onSelect, onCreateNew, onToggleFavorite, disabled }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedPlatform = platforms.find(p => p.id === selectedId);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const handleSelect = (platformId: string) => {
        if (platformId === "__new__") {
            onCreateNew();
        } else {
            onSelect(platformId);
        }
        setIsOpen(false);
    };

    const handleToggleFavorite = (e: React.MouseEvent, platformId: string) => {
        e.stopPropagation(); // Prevent selecting the platform
        if (onToggleFavorite) {
            onToggleFavorite(platformId);
        }
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                style={selectedPlatform ? {
                    borderColor: selectedPlatform.color,
                    backgroundColor: `${selectedPlatform.color}15`
                } : undefined}
            >
                <span className={styles.triggerText}>
                    {selectedPlatform ? (
                        <>
                            <span
                                className={styles.colorDot}
                                style={{ backgroundColor: selectedPlatform.color }}
                            />
                            {selectedPlatform.isFavorite && <span className={styles.star}>⭐</span>}
                            {selectedPlatform.name}
                        </>
                    ) : (
                        "Sélectionner une plateforme"
                    )}
                </span>
                <span className={styles.arrow}>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {platforms.map((platform) => (
                        <div
                            key={platform.id}
                            className={`${styles.optionWrapper} ${platform.id === selectedId ? styles.selected : ""}`}
                            style={{
                                borderLeftColor: platform.color,
                                backgroundColor: platform.id === selectedId
                                    ? `${platform.color}20`
                                    : `${platform.color}08`
                            }}
                        >
                            <button
                                type="button"
                                className={styles.option}
                                onClick={() => handleSelect(platform.id)}
                            >
                                <span
                                    className={styles.colorDot}
                                    style={{ backgroundColor: platform.color }}
                                />
                                <span className={styles.optionText}>{platform.name}</span>
                            </button>
                            {onToggleFavorite && (
                                <button
                                    type="button"
                                    className={styles.favoriteToggle}
                                    onClick={(e) => handleToggleFavorite(e, platform.id)}
                                    title={platform.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                                >
                                    {platform.isFavorite ? "⭐" : "☆"}
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        className={`${styles.option} ${styles.createNew}`}
                        onClick={() => handleSelect("__new__")}
                    >
                        <span className={styles.createIcon}>➕</span>
                        <span className={styles.optionText}>Créer une nouvelle plateforme</span>
                    </button>
                </div>
            )}
        </div>
    );
}
