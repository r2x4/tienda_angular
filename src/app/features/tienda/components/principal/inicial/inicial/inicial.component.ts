import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicial.component.html',
})
export default class InicialComponent {
  images = [
    { src: 'assets/calzado_TennisAdidas1.jpg', alt: 'Tennis Adidas', title: 'Tennis Adidas' },
    { src: 'assets/implementos_Balon_Futbol.jpg', alt: 'Balón de Fútbol', title: 'Balón de Fútbol' },
    { src: 'assets/ropa_Sudadera1.jpg', alt: 'Sudadera Deportiva', title: 'Sudadera' },
    { src: 'assets/suplementos_Proteina_Whey.jpg', alt: 'Proteína Whey', title: 'Proteína Whey' },
    { src: 'assets/calzado_tennis1.jpg', alt: 'Tennis Blanco', title: 'Tennis Blanco' },
    { src: 'assets/implementos_Saco_Boxeo.jpg', alt: 'Saco de Boxeo', title: 'Saco de Boxeo' },
  ];
}
