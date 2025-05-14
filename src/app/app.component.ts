// app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { TicketPurchaseService } from './ticket-purchase.service';
import { NgxSonnerModule } from 'ngx-sonner';
import axios from 'axios';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, NgxSonnerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [TicketPurchaseService], // Provide the service
})
export class AppComponent implements OnInit {
  showModal = true; // Control the modal's visibility
  currentStep$ = this.ticketService.currentStep$;
  formData$ = this.ticketService.formData$;
  isSubmitting$ = this.ticketService.isSubmitting$;
  paymentCode$ = this.ticketService.paymentCode$;
  paymentMade$ = this.ticketService.paymentMade$;
  remainingTime = 30;
  isPaymentButtonDisabled = true;
  private countdownSubscription: Subscription | undefined;

  constructor(private ticketService: TicketPurchaseService) {}

  ngOnInit(): void {
    this.paymentMade$.subscribe((madePayment) => {
      if (madePayment) {
        this.resetForm();
      }
    });
  }

  nextStep(): void {
    if (
      this.ticketService.formData.quantity > 1 &&
      this.ticketService.currentStep$.value === 1
    ) {
      this.ticketService.nextStep(); // Go to the multiple names step
    } else if (this.ticketService.currentStep$.value < 3) {
      this.ticketService.nextStep();
    }
  }

  prevStep(): void {
    if (this.ticketService.currentStep$.value > 1) {
      this.ticketService.prevStep();
    }
  }

  updateFormData(data: Partial<FormData>): void {
    this.ticketService.setFormData(data);
  }

  submitForm(): void {
    this.ticketService.setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      const mockResponse = { code: 'ABC123XYZ' }; // Replace with actual API response
      this.ticketService.setPaymentCode(mockResponse.code);
      this.ticketService.setIsSubmitting(false);
      this.ticketService.nextStep(); // Move to payment details
      this.startPaymentCountdown();
    }, 2000);

    // Actual API call using axios:
    // axios.post('your-submission-endpoint', this.ticketService.formData)
    //   .then(response => {
    //     this.ticketService.setPaymentCode(response.data.code);
    //     this.ticketService.setIsSubmitting(false);
    //     this.ticketService.nextStep(); // Move to payment details
    //     this.startPaymentCountdown();
    //     this.sonner.success('Form submitted successfully!');
    //   })
    //   .catch(error => {
    //     console.error('Submission error:', error);
    //     this.ticketService.setIsSubmitting(false);
    //     this.sonner.error('Failed to submit form.');
    //   });
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
    if (
      !this.isPaymentButtonDisabled &&
      this.ticketService.paymentCode$.value
    ) {
      // Simulate second API call
      setTimeout(() => {
        console.log(
          'Payment confirmed with code:',
          this.ticketService.paymentCode$.value
        );
        this.ticketService.setPaymentMade(true);
        this.sonner.success('Payment confirmed!');
        if (this.countdownSubscription) {
          this.countdownSubscription.unsubscribe();
        }
      }, 1500);

      // Actual API call for confirming payment:
      // axios.post('your-payment-confirmation-endpoint', { code: this.ticketService.paymentCode$.value })
      //   .then(response => {
      //     this.ticketService.setPaymentMade(true);
      //     this.sonner.success('Payment confirmed!');
      //     if (this.countdownSubscription) {
      //       this.countdownSubscription.unsubscribe();
      //     }
      //   })
      //   .catch(error => {
      //     console.error('Payment confirmation error:', error);
      //     this.sonner.error('Failed to confirm payment.');
      //   });
    }
  }

  resetForm(): void {
    this.ticketService.resetForm();
    this.showModal = true; // If you want to keep the modal open after reset
  }
}
