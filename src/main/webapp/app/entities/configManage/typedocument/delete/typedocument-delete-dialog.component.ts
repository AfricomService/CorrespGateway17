import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ITypedocument } from '../typedocument.model';
import { TypedocumentService } from '../service/typedocument.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './typedocument-delete-dialog.component.html',
})
export class TypedocumentDeleteDialogComponent {
  typedocument?: ITypedocument;

  constructor(protected typedocumentService: TypedocumentService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.typedocumentService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
