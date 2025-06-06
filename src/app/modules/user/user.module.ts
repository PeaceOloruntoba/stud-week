import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NgxSonnerToaster } from 'ngx-sonner';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: HomeComponent }]),
    NgxSonnerToaster,
  ],
})
export class UserModule {}
