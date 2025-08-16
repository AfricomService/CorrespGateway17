import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { NotifComponent } from './list/notif.component';
import { NotifDetailComponent } from './detail/notif-detail.component';
import { NotifUpdateComponent } from './update/notif-update.component';
import { NotifDeleteDialogComponent } from './delete/notif-delete-dialog.component';
import { NotifRoutingModule } from './route/notif-routing.module';

@NgModule({
  imports: [SharedModule, NotifRoutingModule],
  declarations: [NotifComponent, NotifDetailComponent, NotifUpdateComponent, NotifDeleteDialogComponent],
})
export class ConnectionManageNotifModule {}
