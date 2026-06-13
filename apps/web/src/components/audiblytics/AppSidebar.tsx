'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/auth-context';
import { isApiStorageBackend } from '@/lib/config/storage-backend';
import {
  isSidebarNavActive,
  resolveSidebarNavItems,
  type SidebarNavItem,
} from '@/lib/navigation/sidebar-nav';
import {
  resolveSidebarProfileInitial,
  resolveSidebarProfileLabel,
} from '@/lib/navigation/sidebar-profile';
import { SettingsSubNav } from '@/components/audiblytics/SettingsSubNav';
import { cn } from '@/lib/utils';

type SidebarNavLinksProps = {
  pathname: string;
  isExpanded: boolean;
  onNavigate?: () => void;
};

function SidebarNavLinks({ pathname, isExpanded, onNavigate }: SidebarNavLinksProps) {
  const navItems = resolveSidebarNavItems(pathname);
  return (
    <>
      {navItems.map((item) => (
        <SidebarNavLink
          key={item.href}
          item={item}
          pathname={pathname}
          isExpanded={isExpanded}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

type SidebarNavLinkProps = {
  item: SidebarNavItem;
  pathname: string;
  isExpanded: boolean;
  onNavigate?: () => void;
};

function SidebarNavLink({ item, pathname, isExpanded, onNavigate }: SidebarNavLinkProps) {
  const Icon = item.icon;
  const isActive = isSidebarNavActive(pathname, item.href);
  const isHomeRoute = pathname === '/';

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      title={isExpanded ? undefined : item.label}
      onClick={onNavigate}
      className={cn(
        'flex h-sidebar-nav-item items-center gap-3 font-sans text-ui-sm text-foreground transition-colors',
        'hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        isExpanded ? (isHomeRoute ? 'mx-2 px-4' : 'px-4') : 'justify-center px-0',
        isActive &&
          (isHomeRoute
            ? 'rounded-sidebar-nav-active bg-cream-shade-2'
            : 'rounded-xl bg-surface-elevated text-primary shadow-sm'),
      )}
    >
      <Icon className="size-[1.125rem] shrink-0" strokeWidth={1.5} />
      <span className={cn(isExpanded ? 'inline' : 'sr-only')}>{item.label}</span>
    </Link>
  );
}

type SidebarProfileFooterProps = {
  isExpanded: boolean;
  profileLabel: string;
  profileInitial: string;
  apiMode: boolean;
  settingsActive: boolean;
  hideSettingsLink?: boolean;
  showLogoutButton?: boolean;
  onLogout?: () => void;
  onNavigate?: () => void;
};

function SidebarProfileFooter({
  isExpanded,
  profileLabel,
  profileInitial,
  apiMode,
  settingsActive,
  hideSettingsLink,
  showLogoutButton = true,
  onLogout,
  onNavigate,
}: SidebarProfileFooterProps) {
  const isHomeFooter = hideSettingsLink;

  return (
    <div className={cn('mt-auto space-y-8', !isExpanded && 'hidden')}>
      <p
        className={cn(
          'font-sans text-caption leading-relaxed text-secondary',
          isHomeFooter && 'border-l-2 border-primary pl-4',
        )}
      >
        Small steps today, confident voice tomorrow.
      </p>

      <div className="space-y-3 border-t border-divider pt-6">
        {!hideSettingsLink ? (
          <Link
            href="/settings"
            aria-current={settingsActive ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'flex min-h-10 items-center gap-3 rounded-lg px-4 text-ui-sm text-foreground transition-colors',
              'hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              settingsActive && 'bg-primary-soft text-primary',
            )}
          >
            <Settings className="size-4 shrink-0" strokeWidth={1.7} />
            <span>Settings</span>
          </Link>
        ) : null}

        <div className="flex items-center justify-between gap-3 px-1">
          <Link
            href="/settings"
            onClick={onNavigate}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 transition-colors',
              'hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              settingsActive && 'text-primary',
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream-shade-2 font-sans text-caption text-secondary">
              {profileInitial}
            </span>
            <span className="truncate font-sans text-ui-sm text-foreground">{profileLabel}</span>
          </Link>
          {apiMode && onLogout && showLogoutButton ? (
            <button
              type="button"
              aria-label="Log out"
              className="rounded-sm text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              onClick={onLogout}
            >
              <LogOut className="size-4" strokeWidth={1.7} />
            </button>
          ) : (
            <ChevronRight
              className="size-4 shrink-0 text-tertiary"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function useSidebarProfile() {
  const apiMode = isApiStorageBackend();
  const { user, loading, logout } = useAuth();
  const profileLabel = resolveSidebarProfileLabel({
    apiMode,
    userEmail: user?.email,
    loading: apiMode && loading,
  });
  const profileInitial = resolveSidebarProfileInitial(profileLabel);

  return { apiMode, profileLabel, profileInitial, logout };
}

export function AppSidebar() {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';
  const settingsActive = pathname.startsWith('/settings');
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const isExpanded = isHome || isPinnedOpen || isHovering;
  const { apiMode, profileLabel, profileInitial, logout } = useSidebarProfile();

  const handleLogout = () => {
    void logout();
  };

  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col overflow-hidden bg-surface transition-all duration-200 lg:flex',
        isHome && 'w-home-sidebar border-r-0 pt-sidebar pb-sidebar px-sidebar',
        !isHome &&
          'border-r border-divider ' +
            (isExpanded ? 'w-52 px-6 py-8' : 'w-20 px-4 py-8'),
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Audiblytics home"
          className={cn(
            'inline-flex min-w-0 items-center gap-3 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
            !isExpanded && 'mx-auto',
          )}
        >
          <BookOpen className="size-7 shrink-0 text-primary" strokeWidth={1.5} />
          <span
            className={cn(
              'truncate font-serif text-ui text-foreground transition-opacity',
              isExpanded ? 'opacity-100' : 'sr-only opacity-0',
            )}
          >
            Audiblytics
          </span>
        </Link>
        {!isHome ? (
          <button
            type="button"
            aria-label={isPinnedOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-pressed={isPinnedOpen}
            className={cn(
              'hidden shrink-0 rounded-sm text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              isExpanded && 'inline-flex',
            )}
            onClick={() => setIsPinnedOpen((current) => !current)}
          >
            {isPinnedOpen ? (
              <PanelLeftClose className="size-4" strokeWidth={1.7} />
            ) : (
              <PanelLeftOpen className="size-4" strokeWidth={1.7} />
            )}
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Primary navigation"
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-sidebar-nav',
          isHome ? 'mt-sidebar-logo-nav' : 'mt-14',
        )}
      >
        <SidebarNavLinks pathname={pathname} isExpanded={isExpanded} />
      </nav>

      {settingsActive && isExpanded ? (
        <div className="mt-6 border-t border-divider pt-6">
          <p className="mb-2 px-3 text-caption font-medium text-secondary">Settings</p>
          <SettingsSubNav showLabels={isExpanded} />
        </div>
      ) : null}

      <SidebarProfileFooter
        isExpanded={isExpanded}
        profileLabel={profileLabel}
        profileInitial={profileInitial}
        apiMode={apiMode}
        settingsActive={settingsActive}
        hideSettingsLink={isHome}
        showLogoutButton={!isHome}
        onLogout={handleLogout}
      />
    </aside>
  );
}

/** Mobile navigation trigger + sheet — visible below `lg` only. */
export function MobileAppNav({ children }: { children?: ReactNode }) {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';
  const settingsActive = pathname.startsWith('/settings');
  const [open, setOpen] = useState(false);
  const { apiMode, profileLabel, profileInitial, logout } = useSidebarProfile();

  const close = () => setOpen(false);

  return (
    <header className="flex items-center justify-between border-b border-divider bg-surface px-5 py-4 lg:hidden">
      <Link
        href="/"
        aria-label="Audiblytics home"
        className="inline-flex items-center gap-2 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <BookOpen className="size-6 shrink-0" strokeWidth={1.7} />
        <span className="text-headline-3 text-foreground">Audiblytics</span>
      </Link>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          className="inline-flex items-center justify-center rounded-sm p-2 text-foreground hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" strokeWidth={1.7} />
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-headline-3">Navigation</DialogTitle>
          </DialogHeader>
          <nav aria-label="Primary navigation" className="flex flex-col gap-2">
            <SidebarNavLinks pathname={pathname} isExpanded onNavigate={close} />
          </nav>
          {settingsActive ? (
            <div className="border-t border-divider pt-4">
              <p className="mb-2 px-1 text-caption font-medium text-secondary">Settings</p>
              <SettingsSubNav showLabels onNavigate={close} />
            </div>
          ) : null}
          <SidebarProfileFooter
            isExpanded
            profileLabel={profileLabel}
            profileInitial={profileInitial}
            apiMode={apiMode}
            settingsActive={settingsActive}
            hideSettingsLink={isHome}
            showLogoutButton={!isHome}
            onLogout={() => {
              void logout();
              close();
            }}
            onNavigate={close}
          />
        </DialogContent>
      </Dialog>

      {children}
    </header>
  );
}
