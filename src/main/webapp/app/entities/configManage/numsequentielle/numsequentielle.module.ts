import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { NumsequentielleComponent } from './list/numsequentielle.component';
import { NumsequentielleDetailComponent } from './detail/numsequentielle-detail.component';
import { NumsequentielleUpdateComponent } from './update/numsequentielle-update.component';
import { NumsequentielleDeleteDialogComponent } from './delete/numsequentielle-delete-dialog.component';
import { NumsequentielleRoutingModule } from './route/numsequentielle-routing.module';

@NgModule({
  imports: [SharedModule, NumsequentielleRoutingModule],
  declarations: [
    NumsequentielleComponent,
    NumsequentielleDetailComponent,
    NumsequentielleUpdateComponent,
    NumsequentielleDeleteDialogComponent,
  ],
})
export class ConfigManageNumsequentielleModule {}
