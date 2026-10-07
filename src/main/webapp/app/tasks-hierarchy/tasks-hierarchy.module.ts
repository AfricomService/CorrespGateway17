import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from 'app/shared/shared.module';
import { TasksHierarchyComponent } from './tasks-hierarchy.component';
import { TASKS_HIERARCHY_ROUTE } from './tasks-hierarchy.route';

@NgModule({
  imports: [SharedModule, RouterModule.forChild([TASKS_HIERARCHY_ROUTE])],
  declarations: [TasksHierarchyComponent],
})
export class TasksHierarchyModule {}
