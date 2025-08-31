import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserAuthModalComponent } from '../../../../auth/user-auth-modal/user-auth-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, UserAuthModalComponent],
  templateUrl: './header.component.html',
})
export default class HeaderComponent {
  @Input() pageTitle: string = 'SPORT-FIVE';
  @Input() showHomeButton: boolean = false;

  isAuthModalOpen: boolean = false;

  openAuthModal() {
    this.isAuthModalOpen = true;
  }

  closeAuthModal() {
    this.isAuthModalOpen = false;
  }
}
