import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { BordereauxComponent } from './list/bordereaux.component';
import { BordereauxDetailComponent } from './detail/bordereaux-detail.component';
import { BordereauxUpdateComponent } from './update/bordereaux-update.component';
import { BordereauxDeleteDialogComponent } from './delete/bordereaux-delete-dialog.component';
import { BordereauxRoutingModule } from './route/bordereaux-routing.module';

@NgModule({
  imports: [SharedModule, BordereauxRoutingModule],
  declarations: [BordereauxComponent, BordereauxDetailComponent, BordereauxUpdateComponent, BordereauxDeleteDialogComponent],
})
export class CorrespManageBordereauxModule {}
