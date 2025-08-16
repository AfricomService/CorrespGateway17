import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { PersonCompanyComponent } from './list/person-company.component';
import { PersonCompanyDetailComponent } from './detail/person-company-detail.component';
import { PersonCompanyUpdateComponent } from './update/person-company-update.component';
import { PersonCompanyDeleteDialogComponent } from './delete/person-company-delete-dialog.component';
import { PersonCompanyRoutingModule } from './route/person-company-routing.module';

@NgModule({
  imports: [SharedModule, PersonCompanyRoutingModule],
  declarations: [PersonCompanyComponent, PersonCompanyDetailComponent, PersonCompanyUpdateComponent, PersonCompanyDeleteDialogComponent],
})
export class ConfigManagePersonCompanyModule {}
