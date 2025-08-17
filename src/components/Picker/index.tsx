import styles from './styles.module.scss';
import React from 'react';


interface TabItem {
    id: string;
    icon: React.ReactNode;
    label?: string;
}


interface PickerProps {
    tabs: TabItem[];
    selectedTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}


export default function Picker({ tabs, selectedTab, onTabChange, className = "" }: PickerProps) {
    return (
        <div className={`${styles.container} ${className}`}>
            {tabs.map((tab) => {
                const isSelected = tab.id === selectedTab;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                        aria-pressed={isSelected}
                        aria-label={tab.label || `Tab ${tab.id}`}
                    >
                        <div className={styles.iconWrapper}>
                            {tab.icon}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}