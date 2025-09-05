import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndexedDbService } from '../../../core/services/indexed-db.service';

interface ServiceItem {
  id?: number;
  name: string;
  description: string;
  price: number;
}

@Component({
  selector: 'app-service-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-crud.html',
  styleUrl: './service-crud.css'
})
export class ServiceCrudComponent implements OnInit {
  services = signal<ServiceItem[]>([]);
  currentService = signal<ServiceItem>({ name: '', description: '', price: 0 });

  private indexedDbService = inject(IndexedDbService);

  ngOnInit(): void {
    this.loadServices();
  }

  async loadServices(): Promise<void> {
    this.services.set(await this.indexedDbService.getServices());
  }

  async addService(): Promise<void> {
    if (this.currentService().name && this.currentService().description && this.currentService().price > 0) {
      await this.indexedDbService.addService(this.currentService());
      this.clearForm();
      this.loadServices();
    } else {
      alert('Por favor, rellena todos los campos.');
    }
  }

  editService(service: ServiceItem): void {
    this.currentService.set({ ...service });
  }

  async updateService(): Promise<void> {
    if (this.currentService().id && this.currentService().name && this.currentService().description && this.currentService().price > 0) {
      await this.indexedDbService.updateService(this.currentService());
      this.clearForm();
      this.loadServices();
    } else {
      alert('Por favor, selecciona un servicio para actualizar y rellena todos los campos.');
    }
  }

  async deleteService(id: number | undefined): Promise<void> {
    if (id) {
      await this.indexedDbService.deleteService(id);
      this.loadServices();
    }
  }

  clearForm(): void {
    this.currentService.set({ name: '', description: '', price: 0 });
  }
}

