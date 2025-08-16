import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { CorrespComponent } from './list/corresp.component';
import { CorrespDetailComponent } from './detail/corresp-detail.component';
import { CorrespUpdateComponent } from './update/corresp-update.component';
import { CorrespDeleteDialogComponent } from './delete/corresp-delete-dialog.component';
import { CorrespRoutingModule } from './route/corresp-routing.module';

@NgModule({
  imports: [SharedModule, CorrespRoutingModule],
  declarations: [CorrespComponent, CorrespDetailComponent, CorrespUpdateComponent, CorrespDeleteDialogComponent],
})
export class CorrespManageCorrespModule {}
