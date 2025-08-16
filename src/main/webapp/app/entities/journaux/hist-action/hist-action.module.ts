import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { HistActionComponent } from './list/hist-action.component';
import { HistActionDetailComponent } from './detail/hist-action-detail.component';
import { HistActionUpdateComponent } from './update/hist-action-update.component';
import { HistActionDeleteDialogComponent } from './delete/hist-action-delete-dialog.component';
import { HistActionRoutingModule } from './route/hist-action-routing.module';

@NgModule({
  imports: [SharedModule, HistActionRoutingModule],
  declarations: [HistActionComponent, HistActionDetailComponent, HistActionUpdateComponent, HistActionDeleteDialogComponent],
})
export class JournauxHistActionModule {}
