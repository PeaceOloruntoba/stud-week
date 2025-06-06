import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment, // Import increment
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, of, BehaviorSubject, catchError } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators'; // Import switchMap
import { toast } from 'ngx-sonner';
import { collection, getDocs, query, where } from 'firebase/firestore';



@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isAuthenticated$: Observable<boolean>;
  public user$: Observable<ExtendedUser | null>;
  private currentUserSubject = new BehaviorSubject<ExtendedUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth = inject(Auth),
    private firestore: Firestore = inject(Firestore),
    private router: Router = inject(Router)
  ) {
    this.isAuthenticated$ = new Observable<boolean>((observer) => {
      onAuthStateChanged(this.auth, (user) => {
        observer.next(!!user);
        observer.complete();
      });
    });

    this.user$ = new Observable<ExtendedUser | null>((observer) => {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(
              doc(this.firestore, `users/${user.uid}`)
            );
            if (userDoc.exists()) {
              const userData = userDoc.data() as UserData;
              const extendedUser: ExtendedUser = {
                emailVerified: user.emailVerified,
                isAnonymous: user.isAnonymous,
                metadata: user.metadata,
                providerData: user.providerData,
                refreshToken: user.refreshToken,
                ...userData,
              };
              observer.next(extendedUser);
              this.currentUserSubject.next(extendedUser);
            } else {
              observer.next(null);
              this.currentUserSubject.next(null);
            }
          } catch (error) {
            console.error('Error fetching user data', error);
            observer.next(null);
            this.currentUserSubject.next(null);
          }
        } else {
          observer.next(null);
          this.currentUserSubject.next(null);
        }
      });
    });

    this.userRole$ = this.user$.pipe(
      map((user) => (user ? user.userType : null))
    );
  }

  async login(email: string, password: string): Promise<ExtendedUser | void> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      return user;
    } catch (error: any) {
      let errorMessage = 'Login Failed!';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      this.router.navigate(['/']);
    } catch (error: any) {
      let errorMessage = 'Logout Failed!';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
      throw error;
    }
  }
}
