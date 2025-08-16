import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { ContactCompanyComponent } from './list/contact-company.component';
import { ContactCompanyDetailComponent } from './detail/contact-company-detail.component';
import { ContactCompanyUpdateComponent } from './update/contact-company-update.component';
import { ContactCompanyDeleteDialogComponent } from './delete/contact-company-delete-dialog.component';
import { ContactCompanyRoutingModule } from './route/contact-company-routing.module';

@NgModule({
  imports: [SharedModule, ContactCompanyRoutingModule],
  declarations: [
    ContactCompanyComponent,
    ContactCompanyDetailComponent,
    ContactCompanyUpdateComponent,
    ContactCompanyDeleteDialogComponent,
  ],
})
export class ConfigManageContactCompanyModule {}
