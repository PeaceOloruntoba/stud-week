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

interface UserData {
  uid: string;
  email: string;
  userType: string;
  isSubscribed?: boolean;
  isProfile?: boolean;
  referralId?: string; // Add referralId
  referralCount?: number; // Add referralCount
  [key: string]: any;
}

export interface ExtendedUser extends UserData {
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: any;
  providerData: any[];
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isAuthenticated$: Observable<boolean>;
  public userRole$: Observable<string | null>;
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

  private getUserData(uid: string): Observable<UserData | null> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userDocRef)).pipe(
      map((userDoc) => {
        if (userDoc.exists()) {
          return userDoc.data() as UserData;
        } else {
          return null;
        }
      }),
      catchError((error) => {
        console.error('Error in getUserData', error);
        return of(null);
      })
    );
  }

  private generateReferralId(
    firstName: string,
    lastName: string,
    uid: string
  ): string {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const uidSuffix = uid.slice(-4);
    return `${firstInitial}${lastInitial}${uidSuffix}`;
  }

  async register(
    email: string,
    password: string,
    userType: string,
    data: Record<string, any>,
    referralId: string | null = null
  ): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;
      const userDocRef = doc(this.firestore, `users/${user.uid}`);

      const newReferralId = this.generateReferralId(
        data['firstName'] || '',
        data['lastName'] || '',
        user.uid
      );

      const userData: UserData = {
        uid: user.uid,
        email,
        userType,
        isProfile: userType === 'company' ? false : true,
        referralId: newReferralId,
        referralCount: 0,
        ...data,
      };

      await setDoc(userDocRef, userData);
      if (referralId) {
        const referrerQuery = query(
          collection(this.firestore, 'users'),
          where('referralId', '==', referralId)
        );
        const referrerSnapshot = await getDocs(referrerQuery);

        if (!referrerSnapshot.empty) {
          const referrerDoc = referrerSnapshot.docs[0];
          const referrerDocRef = doc(this.firestore, `users/${referrerDoc.id}`);

          await updateDoc(referrerDocRef, {
            referralCount: increment(1),
          });
          console.log(
            `Incremented referral count for user with ID: ${referrerDoc.id}`
          );
        } else {
          console.warn(`Referral ID "${referralId}" not found.`);
        }
      }

      const extendedUser: ExtendedUser = {
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        metadata: user.metadata,
        providerData: user.providerData,
        refreshToken: user.refreshToken,
        ...userData,
      };

      this.currentUserSubject.next(extendedUser);

      toast.success('Registration successful!');
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      let errorMessage = 'Registration Failed!';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<ExtendedUser | void> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;
      const userData = await this.getUserData(user.uid)
        .pipe(take(1))
        .toPromise();

      if (!userData) {
        toast.error('User data not found. Please contact support.');
        await signOut(this.auth);
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
        return;
      }

      const extendedUser: ExtendedUser = {
        isSubscribed: userData.isSubscribed,
        isProfile: userData.isProfile,
        referralId: userData.referralId,
        referralCount: userData.referralCount,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        metadata: user.metadata,
        providerData: user.providerData,
        refreshToken: user.refreshToken,
        ...userData,
      };

      this.currentUserSubject.next(extendedUser);

      if (extendedUser.userType === 'company') {
        if (extendedUser.isProfile === false) {
          toast.error('You need to register your company profile to proceed.');
          this.router.navigate(['/company/create-profile']);
          return extendedUser;
        }
        if (!extendedUser.isSubscribed) {
          toast.error(
            'Your company account requires a subscription to access the system.'
          );
          this.router.navigate(['/company/subscription']);
          return extendedUser;
        }
        this.router.navigate(['/company/jobs']);
      } else if (extendedUser.userType === 'user') {
        this.router.navigate(['/users/dashboard']);
      } else if (extendedUser.userType === 'admin') {
        this.router.navigate(['/admin/start']);
      }

      return extendedUser;
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

  async updateUser(uid: string, updates: Partial<UserData>): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userDocRef, updates);
      const updatedUser = await this.getUserData(uid).pipe(take(1)).toPromise();
      const currentUser = this.currentUserSubject.getValue();

      if (!currentUser || !updatedUser) {
        console.warn(
          'Could not update currentUserSubject: Current or updated user data is null.'
        );
        return;
      }
      const extendedUser: ExtendedUser = {
        ...currentUser,
        ...updatedUser,
        uid: updatedUser.uid,
        email: updatedUser.email,
        userType: updatedUser.userType,
        isSubscribed: updatedUser.isSubscribed,
        isProfile: updatedUser.isProfile,
        referralId: updatedUser.referralId,
        referralCount: updatedUser.referralCount,
      };

      this.currentUserSubject.next(extendedUser);
    } catch (error: any) {
      let errorMessage = 'Update User Failed!';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
      throw error;
    }
  }

  getUser(): Observable<ExtendedUser | null> {
    return this.currentUser$;
  }
}
