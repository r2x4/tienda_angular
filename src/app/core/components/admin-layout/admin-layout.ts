import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IndexedDbService } from '../../services/indexed-db.service'; // Import IndexedDbService
import { Sale } from '../../../features/tienda/interfaces/sale.interface'; // Import Sale interface

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private indexedDbService = inject(IndexedDbService); // Inject IndexedDbService

  logout(): void {
    this.authService.logoutAdmin();
  }

  async exportSalesToCsv(): Promise<void> {
    const sales = await this.indexedDbService.getSales();

    if (sales.length === 0) {
      alert('No hay ventas para exportar.');
      return;
    }

    // Create CSV header
    const headers = ['ID', 'Fecha', 'Total', 'Productos'];
    let csv = headers.join(',') + '\n';

    // Add sales data
    sales.forEach(sale => {
      const date = new Date(sale.date).toLocaleString(); // Format timestamp to readable date
      const items = sale.items.map(item => `${item.name} (x${item.quantity})`).join('; ');
      csv += `${sale.id},"${date}",${sale.total},"${items}"\n`;
    });

    // Create a Blob and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection for download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'ventas.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}