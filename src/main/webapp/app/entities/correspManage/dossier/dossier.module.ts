import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { DossierComponent } from './list/dossier.component';
import { DossierDetailComponent } from './detail/dossier-detail.component';
import { DossierUpdateComponent } from './update/dossier-update.component';
import { DossierDeleteDialogComponent } from './delete/dossier-delete-dialog.component';
import { DossierRoutingModule } from './route/dossier-routing.module';

@NgModule({
  imports: [SharedModule, DossierRoutingModule],
  declarations: [DossierComponent, DossierDetailComponent, DossierUpdateComponent, DossierDeleteDialogComponent],
})
export class CorrespManageDossierModule {}
