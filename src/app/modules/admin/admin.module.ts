import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NgxSonnerToaster } from 'ngx-sonner';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
    ]),
    NgxSonnerToaster,
  ],
})
export class AdminModule {}
