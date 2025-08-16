import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { TasksComponent } from './list/tasks.component';
import { TasksDetailComponent } from './detail/tasks-detail.component';
import { TasksUpdateComponent } from './update/tasks-update.component';
import { TasksDeleteDialogComponent } from './delete/tasks-delete-dialog.component';
import { TasksRoutingModule } from './route/tasks-routing.module';

@NgModule({
  imports: [SharedModule, TasksRoutingModule],
  declarations: [TasksComponent, TasksDetailComponent, TasksUpdateComponent, TasksDeleteDialogComponent],
})
export class CorrespManageTasksModule {}
