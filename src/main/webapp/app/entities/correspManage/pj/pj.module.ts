import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { PjComponent } from './list/pj.component';
import { PjDetailComponent } from './detail/pj-detail.component';
import { PjUpdateComponent } from './update/pj-update.component';
import { PjDeleteDialogComponent } from './delete/pj-delete-dialog.component';
import { PjRoutingModule } from './route/pj-routing.module';

@NgModule({
  imports: [SharedModule, PjRoutingModule],
  declarations: [PjComponent, PjDetailComponent, PjUpdateComponent, PjDeleteDialogComponent],
})
export class CorrespManagePjModule {}
