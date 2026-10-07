import { Route } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { TasksHierarchyComponent } from './tasks-hierarchy.component';

export const TASKS_HIERARCHY_ROUTE: Route = {
  path: '',
  component: TasksHierarchyComponent,
  data: {
    pageTitle: 'tasksHierarchy.title',
  },
  canActivate: [UserRouteAccessService],
};
