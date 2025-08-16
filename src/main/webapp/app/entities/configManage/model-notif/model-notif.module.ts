import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { ModelNotifComponent } from './list/model-notif.component';
import { ModelNotifDetailComponent } from './detail/model-notif-detail.component';
import { ModelNotifUpdateComponent } from './update/model-notif-update.component';
import { ModelNotifDeleteDialogComponent } from './delete/model-notif-delete-dialog.component';
import { ModelNotifRoutingModule } from './route/model-notif-routing.module';

@NgModule({
  imports: [SharedModule, ModelNotifRoutingModule],
  declarations: [ModelNotifComponent, ModelNotifDetailComponent, ModelNotifUpdateComponent, ModelNotifDeleteDialogComponent],
})
export class ConfigManageModelNotifModule {}
