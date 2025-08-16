import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IOrgaEntity } from '../orga-entity.model';
import { OrgaEntityService } from '../service/orga-entity.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './orga-entity-delete-dialog.component.html',
})
export class OrgaEntityDeleteDialogComponent {
  orgaEntity?: IOrgaEntity;

  constructor(protected orgaEntityService: OrgaEntityService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.orgaEntityService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
