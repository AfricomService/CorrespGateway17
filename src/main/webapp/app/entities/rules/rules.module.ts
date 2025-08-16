import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { RulesComponent } from './list/rules.component';
import { RulesDetailComponent } from './detail/rules-detail.component';
import { RulesUpdateComponent } from './update/rules-update.component';
import { RulesDeleteDialogComponent } from './delete/rules-delete-dialog.component';
import { RulesRoutingModule } from './route/rules-routing.module';

@NgModule({
  imports: [SharedModule, RulesRoutingModule],
  declarations: [RulesComponent, RulesDetailComponent, RulesUpdateComponent, RulesDeleteDialogComponent],
})
export class RulesModule {}
