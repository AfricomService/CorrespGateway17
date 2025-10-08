import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ICustomSearch } from '../custom-search.model';
import { CustomSearchService } from '../service/custom-search.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './custom-search-delete-dialog.component.html',
})
export class CustomSearchDeleteDialogComponent {
  customSearch?: ICustomSearch;

  constructor(protected customSearchService: CustomSearchService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.customSearchService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
