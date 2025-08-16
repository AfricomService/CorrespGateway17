import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { HistConsultComponent } from './list/hist-consult.component';
import { HistConsultDetailComponent } from './detail/hist-consult-detail.component';
import { HistConsultUpdateComponent } from './update/hist-consult-update.component';
import { HistConsultDeleteDialogComponent } from './delete/hist-consult-delete-dialog.component';
import { HistConsultRoutingModule } from './route/hist-consult-routing.module';

@NgModule({
  imports: [SharedModule, HistConsultRoutingModule],
  declarations: [HistConsultComponent, HistConsultDetailComponent, HistConsultUpdateComponent, HistConsultDeleteDialogComponent],
})
export class JournauxHistConsultModule {}
