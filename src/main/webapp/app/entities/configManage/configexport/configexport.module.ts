import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { ConfigexportComponent } from './list/configexport.component';
import { ConfigexportDetailComponent } from './detail/configexport-detail.component';
import { ConfigexportUpdateComponent } from './update/configexport-update.component';
import { ConfigexportDeleteDialogComponent } from './delete/configexport-delete-dialog.component';
import { ConfigexportRoutingModule } from './route/configexport-routing.module';

@NgModule({
  imports: [SharedModule, ConfigexportRoutingModule],
  declarations: [ConfigexportComponent, ConfigexportDetailComponent, ConfigexportUpdateComponent, ConfigexportDeleteDialogComponent],
})
export class ConfigManageConfigexportModule {}
