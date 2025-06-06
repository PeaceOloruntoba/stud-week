import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from './modules/auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  fliers = [
    'assets/flier1.jpg', // Replace with your actual flier paths
    'assets/flier2.jpg',
  ];
  currentFlier = this.fliers[0];
  private flierSwitchSubscription: Subscription | undefined;
  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Switch fliers every 5 seconds
    this.flierSwitchSubscription = interval(5000).subscribe(() => {
      this.currentFlier =
        this.currentFlier === this.fliers[0] ? this.fliers[1] : this.fliers[0];
    });

    // Subscribe to authentication status
    this.authService.authState$.subscribe((user) => {
      this.isAuthenticated = !!user;
    });
  }

  ngOnDestroy(): void {
    if (this.flierSwitchSubscription) {
      this.flierSwitchSubscription.unsubscribe();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
