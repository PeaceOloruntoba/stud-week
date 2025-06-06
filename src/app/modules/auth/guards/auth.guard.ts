import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    console.log("We're here");
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (user) {
          const expectedRoles = next.data['roles'] as string[];
          if (!expectedRoles || expectedRoles.includes(user.userType)) {
            return true;
          } else {
            console.log(
              `Unauthorized access for role: ${user.userType}, expected: ${expectedRoles}`
            );
            toast.error('Unauthorised');
            return this.router.createUrlTree(['/unauthorized']);
          }
        } else {
          return this.router.createUrlTree(['/auth/login']);
        }
      })
    );
  }
}
