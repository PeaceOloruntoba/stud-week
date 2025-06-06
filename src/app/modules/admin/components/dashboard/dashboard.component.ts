import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface Ticket {
  id: string;
  fullName: string;
  email: string;
  ticketType: string;
  quantity: number;
  attendeeNames: string[];
  paymentCode: string;
  status: string;
  reason?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSonnerToaster],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  tickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  showDeclineForm = false;
  declineReason = '';

  constructor(
    private firestore: AngularFirestore,
    private functions: AngularFireFunctions
  ) {}

  ngOnInit(): void {
    this.firestore
      .collection<Ticket>('tickets')
      .snapshotChanges()
      .subscribe((actions) => {
        this.tickets = actions.map((action) => ({
          id: action.payload.doc.id,
          ...action.payload.doc.data(),
        }));
      });
  }

  viewDetails(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showDeclineForm = false;
    this.declineReason = '';
  }

  confirmTicket(ticket: Ticket): void {
    this.firestore
      .collection('tickets')
      .doc(ticket.id)
      .update({ status: 'confirmed' })
      .then(() => {
        toast.success('Ticket confirmed!');
        this.sendEmail('confirmation', ticket.email, ticket);
        this.selectedTicket = null;
      })
      .catch((error) =>
        toast.error('Error confirming ticket: ' + error.message)
      );
  }

  declineTicket(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showDeclineForm = true;
  }

  submitDecline(): void {
    if (this.selectedTicket && this.declineReason) {
      this.firestore
        .collection('tickets')
        .doc(this.selectedTicket.id)
        .update({ status: 'declined', reason: this.declineReason })
        .then(() => {
          toast.success('Ticket declined!');
          this.sendEmail('rejection', this.selectedTicket!.email, {
            ...this.selectedTicket,
            reason: this.declineReason,
          });
          this.selectedTicket = null;
          this.showDeclineForm = false;
          this.declineReason = '';
        })
        .catch((error) =>
          toast.error('Error declining ticket: ' + error.message)
        );
    }
  }

  sendEmail(type: string, email: string, ticket: Ticket): void {
    const callable = this.functions.httpsCallable('sendEmail');
    callable({ type, email, data: ticket }).subscribe({
      next: () => toast.success('Email sent successfully!'),
      error: (error) => toast.error('Error sending email: ' + error.message),
    });
  }

  exportToExcel(): void {
    const ws = XLSX.utils.json_to_sheet(
      this.tickets.map((ticket) => ({
        PaymentCode: ticket.paymentCode,
        FullName: ticket.fullName,
        Email: ticket.email,
        TicketType: ticket.ticketType,
        Quantity: ticket.quantity,
        Status: ticket.status,
        Reason: ticket.reason || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    XLSX.write(wb, { bookType: 'xlsx', type: 'array' }, 'tickets.xlsx');
  }
}
