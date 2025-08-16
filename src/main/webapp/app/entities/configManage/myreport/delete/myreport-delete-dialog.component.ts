import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IMyreport } from '../myreport.model';
import { MyreportService } from '../service/myreport.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './myreport-delete-dialog.component.html',
})
export class MyreportDeleteDialogComponent {
  myreport?: IMyreport;

  constructor(protected myreportService: MyreportService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.myreportService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
