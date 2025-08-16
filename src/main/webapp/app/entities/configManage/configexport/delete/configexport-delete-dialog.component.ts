import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IConfigexport } from '../configexport.model';
import { ConfigexportService } from '../service/configexport.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './configexport-delete-dialog.component.html',
})
export class ConfigexportDeleteDialogComponent {
  configexport?: IConfigexport;

  constructor(protected configexportService: ConfigexportService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.configexportService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
