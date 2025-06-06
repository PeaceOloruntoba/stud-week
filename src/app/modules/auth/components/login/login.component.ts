import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, NgxSonnerToaster],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  isSubmitting = false;

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.isSubmitting = true;
    this.authService
      .login(this.email, this.password)
      .then(() => {
        this.isSubmitting = false;
        toast.success('Login successful!');
        this.router.navigate(['/admin']);
      })
      .catch((error) => {
        this.isSubmitting = false;
        toast.error('Login failed: ' + error.message);
      });
  }
}
