import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-auth-modal.component.html',
  styleUrls: ['./user-auth-modal.component.css']
})
export class UserAuthModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  showLogin: boolean = true; // true for login, false for register

  // Login form data
  loginData = {
    email: '',
    password: ''
  };

  // Register form data
  registerData = {
    name: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    password: ''
  };

  toggleForm() {
    this.showLogin = !this.showLogin;
  }

  onLogin() {
    // Handle login logic here
    console.log('Login Data:', this.loginData);
    alert('Login functionality not yet implemented.');
  }

  onRegister() {
    // Handle registration logic here
    console.log('Register Data:', this.registerData);
    alert('Registration functionality not yet implemented.');
  }

  onClose() {
    this.closeModal.emit();
  }
}
