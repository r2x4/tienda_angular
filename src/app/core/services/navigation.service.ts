// src/app/services/navigation.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  // Señal para el componente activo
  activeComponent = signal<'contacto' | null>(null);

  // Métodos para cambiar el componente
  showContacto() {
    this.activeComponent.set('contacto');
  }

  hideComponent() {
    this.activeComponent.set(null);
  }
}