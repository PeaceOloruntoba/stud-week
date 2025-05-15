import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

interface FormData {
  fullName: string;
  ticketType: string;
  quantity: number;
  attendeeNames: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSonnerToaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  showModal = true;
  currentStep = 1;
  formData: FormData = {
    fullName: '',
    ticketType: '',
    quantity: 1,
    attendeeNames: [],
  };
  isSubmitting = false;
  paymentCode: string | null = null;
  paymentMade = false;
  remainingTime = 30;
  isPaymentButtonDisabled = true;
  private countdownSubscription: Subscription | undefined;

  constructor() {}

  ngOnInit(): void {
    //  this.paymentMade$.subscribe((madePayment) => { // Removed service dependency
    //    if (madePayment) {
    //      this.resetForm();
    //    }
    //  });
  }

  nextStep(): void {
    if (this.formData.quantity > 1 && this.currentStep === 1) {
      this.currentStep = 2;
    } else if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitForm(): void {
    this.isSubmitting = true;
    setTimeout(() => {
      this.paymentCode = 'ABC123XYZ';
      this.isSubmitting = false;
      this.currentStep = 3;
      this.startPaymentCountdown();
      toast.success('Form submitted successfully!');
    }, 2000);
  }

  startPaymentCountdown(): void {
    this.isPaymentButtonDisabled = true;
    this.remainingTime = 30;
    this.countdownSubscription = interval(1000)
      .pipe(take(30))
      .subscribe(
        () => {
          this.remainingTime--;
        },
        null,
        () => {
          this.isPaymentButtonDisabled = false;
        }
      );
  }

  madePayment(): void {
    if (!this.isPaymentButtonDisabled && this.paymentCode) {
      setTimeout(() => {
        console.log('Payment confirmed with code:', this.paymentCode);
        this.paymentMade = true;
        toast.success('Payment confirmed!');
        if (this.countdownSubscription) {
          this.countdownSubscription.unsubscribe();
        }
        this.resetForm(); // simplified reset.
      }, 1500);
    }
  }

  resetForm(): void {
    this.formData = {
      fullName: '',
      ticketType: '',
      quantity: 1,
      attendeeNames: [],
    };
    this.currentStep = 1;
    this.paymentCode = null;
    this.paymentMade = false;
    this.showModal = true;
  }

  getNumber(n: number): number[] {
    return Array.from({ length: n }, (_, index) => index);
  }

  updateAttendeeNames() {
    this.formData.attendeeNames = Array(this.formData.quantity).fill('');
  }
}
