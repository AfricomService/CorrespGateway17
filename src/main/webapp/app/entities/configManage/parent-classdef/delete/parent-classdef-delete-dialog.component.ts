import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IParentClassdef } from '../parent-classdef.model';
import { ParentClassdefService } from '../service/parent-classdef.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './parent-classdef-delete-dialog.component.html',
})
export class ParentClassdefDeleteDialogComponent {
  parentClassdef?: IParentClassdef;

  constructor(protected parentClassdefService: ParentClassdefService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.parentClassdefService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
