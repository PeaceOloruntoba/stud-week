import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({});
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService
      .login(email, password)
      .then((user) => {
        this.loading = false;
        toast.success('Login Successful!');
        console.log(user);
        if (user) {
          switch (user.userType) {
            case 'user':
              this.router.navigate(['/users/dashboard']);
              break;
            case 'company':
              if (!user.isProfile) {
                this.router.navigate(['/company/create-profile']);
                return;
              }
              if (!user.isSubscribed) {
                this.router.navigate(['/company/subscription']);
                return;
              }
              this.router.navigate(['/company/jobs']);
              break;
            case 'admin':
              this.router.navigate(['/admin/start']);
              break;
            default:
              this.router.navigate(['/']);
          }
        }
      })
      .catch((error: any) => {
        // Explicitly type error as any
        this.loading = false;
        console.error('Login error:', error);
      });
  }
}
