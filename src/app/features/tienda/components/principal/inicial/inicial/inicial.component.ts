import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { INICIAL_IMAGES } from '../../../../constants/image-data';

@Component({
  selector: 'app-inicial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicial.component.html',
})
export default class InicialComponent {
  images = INICIAL_IMAGES;
}
