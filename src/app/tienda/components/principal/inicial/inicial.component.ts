import { Component } from '@angular/core';
import FooterComponent from '../footer/footer/footer.component';
import HeaderComponent from '../header/header/header.component';

@Component({
  selector: 'app-inicial',
  standalone: true,
  imports: [FooterComponent, HeaderComponent],
  templateUrl: './inicial.component.html',
})
export default class InicialComponent { }
