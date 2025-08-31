import { Component, Input, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserAuthModalComponent } from '../../../../auth/user-auth-modal/user-auth-modal.component';
import { CartService } from '../../../../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, UserAuthModalComponent],
  templateUrl: './header.component.html',
})
export default class HeaderComponent {
  @Input() pageTitle: string = 'SPORT-FIVE';
  @Input() showHomeButton: boolean = false;

  private cartService = inject(CartService);
  public cartItemCount = computed(() => {
    return this.cartService.cartItems().reduce((acc, item) => acc + (item.quantity || 0), 0);
  });

  isAuthModalOpen: boolean = false;

  openAuthModal() {
    this.isAuthModalOpen = true;
  }

  closeAuthModal() {
    this.isAuthModalOpen = false;
  }
}
