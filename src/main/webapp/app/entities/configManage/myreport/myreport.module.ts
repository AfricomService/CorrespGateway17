import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { MyreportComponent } from './list/myreport.component';
import { MyreportDetailComponent } from './detail/myreport-detail.component';
import { MyreportUpdateComponent } from './update/myreport-update.component';
import { MyreportDeleteDialogComponent } from './delete/myreport-delete-dialog.component';
import { MyreportRoutingModule } from './route/myreport-routing.module';

@NgModule({
  imports: [SharedModule, MyreportRoutingModule],
  declarations: [MyreportComponent, MyreportDetailComponent, MyreportUpdateComponent, MyreportDeleteDialogComponent],
})
export class ConfigManageMyreportModule {}
