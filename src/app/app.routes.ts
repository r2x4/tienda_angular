import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';
import { AdminLayoutComponent } from './core/components/admin-layout/admin-layout';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop'; // New import
import { take } from 'rxjs/operators'; // New import

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/admin-login/admin-login').then(m => m.AdminLoginComponent),
    data: { title: 'Admin Login' }
  },
  {
    path: 'admin', // Parent route for admin section
    component: AdminLayoutComponent, // Use the new admin layout
    canActivate: [() => toObservable(inject(AuthService).isAdminAuthenticated).pipe(take(1))], // Protect admin routes
    children: [
      {
        path: 'services',
        loadComponent: () => import('./features/admin/service-crud/service-crud').then(m => m.ServiceCrudComponent),
        data: { title: 'Admin Services' }
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/product-crud/product-crud').then(m => m.ProductCrudComponent),
        data: { title: 'Admin Products' }
      },
      {
        path: '', // Default child route for /admin
        redirectTo: 'services',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'inicial',
    pathMatch: 'full'
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'inicial',
        loadComponent: () => import('./features/tienda/components/principal/inicial/inicial/inicial.component'),
        data: { title: 'Inicio' }
      },
      {
        path: 'contacto',
        loadComponent: () => import('./features/tienda/components/principal/footer/contacto/contacto/contacto.component').then(m => m.ContactoComponent),
        data: { title: 'Contacto' }
      },
      {
        path: 'reseñas',
        loadComponent: () => import('./features/tienda/components/principal/footer/reseñas/reseñas/reseñas.component').then(m => m.ReseñasComponent),
        data: { title: 'Reseñas' }
      },
      {
        path: 'nosotros',
        loadComponent: () => import('./features/tienda/components/principal/footer/nosotros/nosotros/nosotros.component').then(m => m.NosotrosComponent),
        data: { title: 'Nosotros' }
      },
      {
        path: 'implementos',
        loadComponent: () => import('./features/tienda/pages/implementos/implementos.component').then(m => m.ImplementosComponent),
        data: { title: 'Implementos' }
      },
      {
        path: 'calzado',
        loadComponent: () => import('./features/tienda/pages/calzado/calzado.component').then(m => m.CalzadoComponent),
        data: { title: 'Calzado' }
      },
      {
        path: 'ropa',
        loadComponent: () => import('./features/tienda/pages/ropa/ropa.component').then(m => m.RopaComponent),
        data: { title: 'Ropa' }
      },
      {
        path: 'suplementos',
        loadComponent: () => import('./features/tienda/pages/suplementos/suplementos.component').then(m => m.SuplementosComponent),
        data: { title: 'Suplementos' }
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/tienda/pages/cart-page/cart-page').then(m => m.CartPageComponent),
        data: { title: 'Carrito' }
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'inicial',
  },
];
