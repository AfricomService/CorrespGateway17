import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { OrgaEntityComponent } from './list/orga-entity.component';
import { OrgaEntityDetailComponent } from './detail/orga-entity-detail.component';
import { OrgaEntityUpdateComponent } from './update/orga-entity-update.component';
import { OrgaEntityDeleteDialogComponent } from './delete/orga-entity-delete-dialog.component';
import { OrgaEntityRoutingModule } from './route/orga-entity-routing.module';

@NgModule({
  imports: [SharedModule, OrgaEntityRoutingModule],
  declarations: [OrgaEntityComponent, OrgaEntityDetailComponent, OrgaEntityUpdateComponent, OrgaEntityDeleteDialogComponent],
})
export class OrgacareOrgaEntityModule {}
