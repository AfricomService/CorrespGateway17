import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { CustomSearchComponent } from './list/custom-search.component';
import { CustomSearchDetailComponent } from './detail/custom-search-detail.component';
import { CustomSearchUpdateComponent } from './update/custom-search-update.component';
import { CustomSearchDeleteDialogComponent } from './delete/custom-search-delete-dialog.component';
import { CustomSearchRoutingModule } from './route/custom-search-routing.module';

@NgModule({
  imports: [SharedModule, CustomSearchRoutingModule],
  declarations: [CustomSearchComponent, CustomSearchDetailComponent, CustomSearchUpdateComponent, CustomSearchDeleteDialogComponent],
})
export class CorrespManageCustomSearchModule {}
