import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { TasksComponent } from '../list/tasks.component';
import { TasksDetailComponent } from '../detail/tasks-detail.component';
import { TasksUpdateComponent } from '../update/tasks-update.component';
import { TasksRoutingResolveService } from './tasks-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const tasksRoute: Routes = [
  {
    path: '',
    component: TasksComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: TasksDetailComponent,
    resolve: {
      tasks: TasksRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: TasksUpdateComponent,
    resolve: {
      tasks: TasksRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: TasksUpdateComponent,
    resolve: {
      tasks: TasksRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(tasksRoute)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
