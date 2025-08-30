import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicial',
    pathMatch: 'full'
  },
  {
    path: 'inicial',
    loadComponent: () => import('./tienda/components/principal/inicial/inicial.component'),
  },
  {
    path: 'contacto',
    loadComponent: () => import('./tienda/components/principal/footer/contacto/contacto.component').then(m => m.ContactoComponent),
  },
  {
    path: 'reseñas',
    loadComponent: () => import('./tienda/components/principal/footer/reseñas/reseñas.component').then(m => m.ReseñasComponent),
  },
  {
    path: 'nosotros',
    loadComponent: () => import('./tienda/components/principal/footer/nosotros/nosotros.component').then(m => m.NosotrosComponent),
  },
  {
    path: '**',
    redirectTo: 'inicial',
  },

];
