import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { DetailInfoComponent } from './list/detail-info.component';
import { DetailInfoUpdateComponent } from './update/detail-info-update.component';
import { DetailInfoRoutingModule } from './route/detail-info-routing.module';

@NgModule({
  imports: [SharedModule, DetailInfoRoutingModule],
  declarations: [DetailInfoComponent, DetailInfoUpdateComponent],
})
export class ConfigManageDetailInfoModule {}
