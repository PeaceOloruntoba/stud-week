import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authState = new BehaviorSubject<any>(null);
  authState$ = this.authState.asObservable();

  constructor(private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe((user) => {
      this.authState.next(user);
    });
  }

  login(email: string, password: string): Promise<void> {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then(() => {})
      .catch((error) => {
        throw error;
      });
  }

  logout(): Promise<void> {
    return this.afAuth
      .signOut()
      .then(() => {})
      .catch((error) => {
        throw error;
      });
  }
}
