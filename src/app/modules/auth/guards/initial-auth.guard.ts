// src/app/guards/initial-auth.guard.ts
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class InitialAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const currentUrl = state.url;

    const excluded = [
      '/company/subscription/success',
      '/company/subscription/cancel',
    ];

    return this.authService.user$.pipe(
      take(1),
      map((user) => {
        if (excluded.includes(currentUrl)) return true;

        if (!user) return this.router.createUrlTree(['/auth/login']);

        if (user.userType === 'company') {
          if (!user.isProfile) {
            return this.router.createUrlTree(['/company/create-profile']);
          }
          if (!user.isSubscribed) {
            return this.router.createUrlTree(['/company/subscription']);
          }
          return true;
        }

        if (user.userType === 'user') {
          return this.router.createUrlTree(['/users/dashboard']);
        }

        if (user.userType === 'admin') {
          return this.router.createUrlTree(['/admin/start']);
        }

        return this.router.createUrlTree(['/auth/login']);
      })
    );
  }
}
