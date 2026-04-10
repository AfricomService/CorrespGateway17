import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { SmtpConfigComponent } from './list/smtp-config.component';
import { SmtpConfigDetailComponent } from './detail/smtp-config-detail.component';
import { SmtpConfigUpdateComponent } from './update/smtp-config-update.component';
import { SmtpConfigDeleteDialogComponent } from './delete/smtp-config-delete-dialog.component';
import { SmtpConfigRoutingModule } from './route/smtp-config-routing.module';

@NgModule({
  imports: [SharedModule, SmtpConfigRoutingModule],
  declarations: [SmtpConfigComponent, SmtpConfigDetailComponent, SmtpConfigUpdateComponent, SmtpConfigDeleteDialogComponent],
})
export class CorrespManageSmtpConfigModule {}
