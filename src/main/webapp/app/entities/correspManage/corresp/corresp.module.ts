import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { CorrespComponent } from './list/corresp.component';
import { CorrespDetailComponent } from './detail/corresp-detail.component';
import { CorrespUpdateComponent } from './update/corresp-update.component';
import { CorrespDeleteDialogComponent } from './delete/corresp-delete-dialog.component';
import { CorrespRoutingModule } from './route/corresp-routing.module';
import {
  DxAccordionModule,
  DxButtonModule,
  DxDataGridModule,
  DxHtmlEditorModule,
  DxListModule,
  DxSelectBoxModule,
  DxTreeViewModule,
} from 'devextreme-angular';
import { FilePreviewComponent } from '../pj/file-preview/file-preview.component';
import { CorrespOutUpdateComponent } from './corresp-out-update/corresp-out-update.component';
import { CorrespDetailOutgoingComponent } from './corresp-detail-outgoing/corresp-detail-outgoing.component';
import { CorrespDetailIncomingComponent } from './corresp-detail-incoming/corresp-detail-incoming.component';

@NgModule({
  imports: [
    SharedModule,
    CorrespRoutingModule,
    DxDataGridModule,
    DxAccordionModule,
    DxHtmlEditorModule,
    DxListModule,
    DxTreeViewModule,
    FilePreviewComponent,
    DxButtonModule,
    DxSelectBoxModule,
  ],
  declarations: [
    CorrespComponent,
    CorrespDetailComponent,
    CorrespUpdateComponent,
    CorrespDeleteDialogComponent,
    CorrespOutUpdateComponent,
    CorrespDetailOutgoingComponent,
    CorrespDetailIncomingComponent,
  ],
})
export class CorrespManageCorrespModule {}
