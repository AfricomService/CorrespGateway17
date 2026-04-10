import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ISmtpConfig } from '../smtp-config.model';
import { SmtpConfigService } from '../service/smtp-config.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './smtp-config-delete-dialog.component.html',
})
export class SmtpConfigDeleteDialogComponent {
  smtpConfig?: ISmtpConfig;

  constructor(protected smtpConfigService: SmtpConfigService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.smtpConfigService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
