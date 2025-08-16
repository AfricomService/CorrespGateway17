import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { TypedocumentComponent } from './list/typedocument.component';
import { TypedocumentDetailComponent } from './detail/typedocument-detail.component';
import { TypedocumentUpdateComponent } from './update/typedocument-update.component';
import { TypedocumentDeleteDialogComponent } from './delete/typedocument-delete-dialog.component';
import { TypedocumentRoutingModule } from './route/typedocument-routing.module';

@NgModule({
  imports: [SharedModule, TypedocumentRoutingModule],
  declarations: [TypedocumentComponent, TypedocumentDetailComponent, TypedocumentUpdateComponent, TypedocumentDeleteDialogComponent],
})
export class ConfigManageTypedocumentModule {}
