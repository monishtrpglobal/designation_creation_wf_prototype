"use client";

import { useState, type ReactNode } from "react";
import {
  IconAlertCircle,
  IconBell,
  IconChevronDown,
  IconEye,
  IconFileSpreadsheet,
  IconInfo,
  IconLanguage,
  IconLayoutSidebar,
  IconMaximize,
  IconSettings,
  IconUserCircle,
} from "./icons";
import styles from "./AppFrame.module.css";

const navItems = [
  { id: "imatrix", label: "iMatrix", icon: IconFileSpreadsheet },
  { id: "settings", label: "Settings", icon: IconSettings },
  { id: "itac", label: "ITAC", icon: IconAlertCircle },
  { id: "review", label: "User Access Review", icon: IconEye },
  { id: "notification", label: "Notification", icon: IconBell },
  { id: "matrix", label: "User Auth Matrix", icon: IconUserCircle },
  { id: "audit", label: "Audit History", icon: IconInfo },
] as const;

type AppFrameProps = {
  children: ReactNode;
  userName?: string;
};

export function AppFrame({ children, userName = "Monish" }: AppFrameProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoChip}>
            <Logo />
          </span>
          <p className={styles.word}>iRM</p>
          <button
            type="button"
            className={styles.toggle}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <IconLayoutSidebar size="s16" />
          </button>
        </div>
        <div className={styles.tools}>
          <button type="button" className={styles.iconButton} aria-label="Notifications">
            <IconBell size="s18" />
            <span className={styles.unread} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Language">
            <IconLanguage size="s18" />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Maximize">
            <IconMaximize size="s18" />
          </button>
          <button type="button" className={styles.profile} aria-label={`Profile, ${userName} (sample)`}>
            <IconUserCircle size="s24" />
            <span>{userName}</span>
            <IconChevronDown size="s18" />
          </button>
        </div>
      </header>
      <div className={styles.body}>
        {sidebarOpen ? (
          <nav className={styles.sidebar} aria-label="iMatrix">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === "matrix";
              return (
                <button
                  key={item.id}
                  type="button"
                  className={styles.navItem}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size="s20" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <svg className={styles.logo} viewBox="0 0 40 40" aria-hidden>
      <path
        d="M28 2H12C6.47715 2 2 6.47715 2 12V28C2 33.5228 6.47715 38 12 38H28C33.5228 38 38 33.5228 38 28V12C38 6.47715 33.5228 2 28 2Z"
        fill="var(--color-brand-teal)"
      />
      <path d="M9 18.5V29" stroke="var(--color-gray-0)" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M15 29V18.5M15 22.5C15 19.5 16.8 18 19.5 18"
        stroke="var(--color-gray-0)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M23 29V18.5L27.5 24.5L32 18.5V29"
        stroke="var(--color-gray-0)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="13.5" r="1.9" fill="var(--color-gray-0)" />
    </svg>
  );
}
