import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface FormData {
  fullName: string;
  ticketType: string;
  quantity: number;
  attendeeNames: string[];
}

@Injectable({
  providedIn: 'root',
})
export class TicketPurchaseService {
  private formDataSubject = new BehaviorSubject<FormData>({
    fullName: '',
    ticketType: '',
    quantity: 1,
    attendeeNames: [],
  });
  formData$ = this.formDataSubject.asObservable();
  private currentStepSubject = new BehaviorSubject<number>(1);
  currentStep$ = this.currentStepSubject.asObservable();
  private paymentCodeSubject = new BehaviorSubject<string | null>(null);
  paymentCode$ = this.paymentCodeSubject.asObservable();
  private isSubmittingSubject = new BehaviorSubject<boolean>(false);
  isSubmitting$ = this.isSubmittingSubject.asObservable();
  private paymentMadeSubject = new BehaviorSubject<boolean>(false);
  paymentMade$ = this.paymentMadeSubject.asObservable();

  get formData(): FormData {
    return this.formDataSubject.getValue();
  }

  setFormData(data: Partial<FormData>): void {
    this.formDataSubject.next({ ...this.formDataSubject.getValue(), ...data });
  }

  nextStep(): void {
    this.currentStepSubject.next(this.currentStepSubject.getValue() + 1);
  }

  prevStep(): void {
    this.currentStepSubject.next(this.currentStepSubject.getValue() - 1);
  }

  resetForm(): void {
    this.formDataSubject.next({
      fullName: '',
      ticketType: '',
      quantity: 1,
      attendeeNames: [],
    });
    this.currentStepSubject.next(1);
    this.paymentCodeSubject.next(null);
    this.paymentMadeSubject.next(false);
  }

  setPaymentCode(code: string): void {
    this.paymentCodeSubject.next(code);
  }

  setIsSubmitting(isSubmitting: boolean): void {
    this.isSubmittingSubject.next(isSubmitting);
  }

  setPaymentMade(paymentMade: boolean): void {
    this.paymentMadeSubject.next(paymentMade);
  }
}
