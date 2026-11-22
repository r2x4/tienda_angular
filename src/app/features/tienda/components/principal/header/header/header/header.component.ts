import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UserAuthModalComponent } from '../../../../auth/user-auth-modal/user-auth-modal.component';
import { CartService } from '../../../../../services/cart.service';
import { AuthSessionService } from '../../../../../../../core/auth/services/auth-session.service';

interface NavItem { label: string; route: string; exact?: boolean; }

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, UserAuthModalComponent],
  templateUrl: './header.component.html',
  styles: [`
    .nav-link{color:var(--color-ink-600);font-weight:600;transition:color var(--transition-fast)}
    .nav-link:hover,.nav-link.is-active{color:var(--color-teal-700)}
    .nav-link.is-active{position:relative}
    .nav-link.is-active::after{content:'';position:absolute;left:0;right:0;bottom:-.45rem;height:2px;background:var(--color-teal-600);border-radius:999px}
    .icon-btn{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:.75rem;color:var(--color-ink-900)}
    .icon-btn:hover{background:rgba(31,122,119,.08);color:var(--color-teal-700)}
    .drawer{transition:transform var(--transition-base),opacity var(--transition-base)}
  `]
})
export default class HeaderComponent implements OnDestroy {
  private readonly cartService: CartService = inject(CartService);
  private readonly auth: AuthSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  @ViewChild('menuButton') menuButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('drawerPanel') drawerPanel?: ElementRef<HTMLElement>;

  readonly navItems: NavItem[] = [
    { label: 'Inicio', route: '/inicial', exact: true },
    { label: 'Calzado', route: '/calzado' },
    { label: 'Implementos', route: '/implementos' },
    { label: 'Ropa', route: '/ropa' },
    { label: 'Suplementos', route: '/suplementos' },
    { label: 'Servicios', route: '/servicios' },
  ];

  readonly mobileOpen = signal(false);
  readonly isAuthModalOpen = signal(false);
  readonly cartItemCount = computed(() => this.cartService.cartItems().reduce((acc, item) => acc + (item.quantity || 0), 0));
  readonly accountLabel = computed(() => {
    if (!this.auth.isAuthenticated()) return 'Ingresar';
    const user = this.auth.user();
    return user?.first_name || user?.username || user?.email?.split('@')[0] || 'Mi cuenta';
  });

  private subs = new Subscription();
  private lastFocus: HTMLElement | null = null;

  constructor() {
    this.subs.add(this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.closeMobile()));
    effect(() => { this.syncBodyScroll(this.mobileOpen()); });
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); this.syncBodyScroll(false); }

  openMobile(): void {
    this.lastFocus = this.doc.activeElement as HTMLElement;
    this.mobileOpen.set(true);
    setTimeout(() => this.focusFirstInDrawer(), 0);
  }

  closeMobile(restoreFocus = true): void {
    if (!this.mobileOpen()) return;
    this.mobileOpen.set(false);
    if (restoreFocus) setTimeout(() => (this.lastFocus || this.menuButton?.nativeElement)?.focus(), 0);
  }

  onNavClick(): void { this.closeMobile(false); }

  openAuthModal(): void { this.closeMobile(false); this.isAuthModalOpen.set(true); }
  closeAuthModal(): void { this.isAuthModalOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.mobileOpen()) this.closeMobile(); }

  @HostListener('document:keydown', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    if (!this.mobileOpen() || event.key !== 'Tab') return;
    const panel = this.drawerPanel?.nativeElement;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.doc.activeElement;
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  }

  private focusFirstInDrawer(): void {
    const panel = this.drawerPanel?.nativeElement;
    const first = panel?.querySelector<HTMLElement>('button,a[href]');
    (first || panel)?.focus();
  }

  private syncBodyScroll(locked: boolean): void {
    this.doc.body.style.overflow = locked ? 'hidden' : '';
  }
}
