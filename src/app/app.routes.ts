import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';

export const routes: Routes = [
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
        path: 'alimentos',
        loadComponent: () => import('./features/tienda/pages/alimentos/alimentos.component').then(m => m.AlimentosComponent),
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
