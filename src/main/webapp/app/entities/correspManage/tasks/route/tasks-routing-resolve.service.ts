import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ITasks } from '../tasks.model';
import { TasksService } from '../service/tasks.service';

@Injectable({ providedIn: 'root' })
export class TasksRoutingResolveService implements Resolve<ITasks | null> {
  constructor(protected service: TasksService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ITasks | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((tasks: HttpResponse<ITasks>) => {
          if (tasks.body) {
            return of(tasks.body);
          } else {
            this.router.navigate(['404']);
            return EMPTY;
          }
        })
      );
    }
    return of(null);
  }
}
