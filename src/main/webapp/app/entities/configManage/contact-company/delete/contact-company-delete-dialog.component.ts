import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IContactCompany } from '../contact-company.model';
import { ContactCompanyService } from '../service/contact-company.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './contact-company-delete-dialog.component.html',
})
export class ContactCompanyDeleteDialogComponent {
  contactCompany?: IContactCompany;

  constructor(protected contactCompanyService: ContactCompanyService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.contactCompanyService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
