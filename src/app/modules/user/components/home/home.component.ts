import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import jsPDF from 'jspdf';

interface FormData {
  fullName: string;
  email: string;
  ticketType: 'regular' | 'vip' | 'student';
  quantity: number;
  attendeeNames: string[];
  paymentCode?: string;
  status?: string;
  timestamp?: any;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule, NgxSonnerToaster],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  showModal = true;
  currentStep = 1;
  formData: FormData = {
    fullName: '',
    email: '',
    ticketType: 'regular',
    quantity: 1,
    attendeeNames: [],
    status: 'pending',
  };
  isSubmitting = false;
  paymentCode: string | null = null;
  paymentMade = false;
  remainingTime = 30;
  isPaymentButtonDisabled = true;
  private countdownSubscription: Subscription | undefined;

  constructor(
    private firestore: AngularFirestore,
    private functions: AngularFireFunctions
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  nextStep(): void {
    if (this.formData.quantity > 1 && this.currentStep === 1) {
      this.currentStep = 2;
    } else if (this.currentStep < 3) {
      this.currentStep = 3;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  calculateAmount(): number {
    const prices: { [key: string]: number } = {
      regular: 5000,
      vip: 15000,
      student: 3000,
    };
    return prices[this.formData.ticketType] * this.formData.quantity;
  }

  submitForm(): void {
    this.isSubmitting = true;
    this.paymentCode = this.generatePaymentCode();
    this.formData.paymentCode = this.paymentCode;
    this.formData.timestamp = new Date();

    this.firestore
      .collection('tickets')
      .add(this.formData)
      .then(() => {
        this.isSubmitting = false;
        this.currentStep = 3;
        this.startPaymentCountdown();
        toast.success('Form submitted successfully!');
        this.sendEmail('submission', this.formData.email);
      })
      .catch((error) => {
        this.isSubmitting = false;
        toast.error('Error submitting form: ' + error.message);
      });
  }

  generatePaymentCode(): string {
    return 'TICKET' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  startPaymentCountdown(): void {
    this.isPaymentButtonDisabled = true;
    this.remainingTime = 30;
    this.countdownSubscription = interval(1000)
      .pipe(take(30))
      .subscribe({
        next: () => {
          this.remainingTime--;
        },
        complete: () => {
          this.isPaymentButtonDisabled = false;
        },
      });
  }

  madePayment(): void {
    if (!this.isPaymentButtonDisabled && this.paymentCode) {
      this.firestore
        .collection('tickets')
        .doc(this.paymentCode)
        .update({ status: 'payment_made' })
        .then(() => {
          this.paymentMade = true;
          toast.success('Payment confirmation submitted!');
          this.sendEmail('payment', this.formData.email);
          this.resetForm();
        })
        .catch((error) => {
          toast.error('Error confirming payment: ' + error.message);
        });
    }
  }

  downloadReceipt(): void {
    const doc = new jsPDF();
    doc.text('Ticket Purchase Receipt', 10, 10);
    doc.text(`Full Name: ${this.formData.fullName}`, 10, 20);
    doc.text(`Email: ${this.formData.email}`, 10, 30);
    doc.text(`Ticket Type: ${this.formData.ticketType}`, 10, 40);
    doc.text(`Quantity: ${this.formData.quantity}`, 10, 50);
    doc.text(`Payment Code: ${this.paymentCode}`, 10, 60);
    doc.text(`Amount: ${this.calculateAmount()} NGN`, 10, 70);
    doc.text(`Account Number: 8166846226`, 10, 80);
    doc.text(`Bank: Opay`, 10, 90);
    doc.text(`Bank Holder: Peace Joseph Oloruntoba`, 10, 100);
    doc.save(`receipt_${this.paymentCode}.pdf`);
  }

  sendEmail(type: string, email: string): void {
    const callable = this.functions.httpsCallable('sendEmail');
    callable({
      type,
      email,
      data: {
        ...this.formData,
        amount: this.calculateAmount(),
        paymentCode: this.paymentCode,
      },
    }).subscribe({
      next: () => toast.success('Email sent successfully!'),
      error: (error) => toast.error('Error sending email: ' + error.message),
    });
  }

  resetForm(): void {
    this.formData = {
      fullName: '',
      email: '',
      ticketType: 'regular',
      quantity: 1,
      attendeeNames: [],
      status: 'pending',
    };
    this.currentStep = 1;
    this.paymentCode = null;
    this.paymentMade = false;
    this.showModal = true;
  }

  getNumber(n: number): number[] {
    return Array.from({ length: n }, (_, index) => index);
  }

  updateAttendeeNames(): void {
    this.formData.attendeeNames = Array(this.formData.quantity).fill('');
  }
}
