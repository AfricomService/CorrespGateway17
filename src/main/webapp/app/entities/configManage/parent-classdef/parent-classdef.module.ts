import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { ParentClassdefComponent } from './list/parent-classdef.component';
import { ParentClassdefDetailComponent } from './detail/parent-classdef-detail.component';
import { ParentClassdefUpdateComponent } from './update/parent-classdef-update.component';
import { ParentClassdefDeleteDialogComponent } from './delete/parent-classdef-delete-dialog.component';
import { ParentClassdefRoutingModule } from './route/parent-classdef-routing.module';

@NgModule({
  imports: [SharedModule, ParentClassdefRoutingModule],
  declarations: [
    ParentClassdefComponent,
    ParentClassdefDetailComponent,
    ParentClassdefUpdateComponent,
    ParentClassdefDeleteDialogComponent,
  ],
})
export class ConfigManageParentClassdefModule {}
