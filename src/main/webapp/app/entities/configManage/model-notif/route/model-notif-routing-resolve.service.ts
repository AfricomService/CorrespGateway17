import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IModelNotif } from '../model-notif.model';
import { ModelNotifService } from '../service/model-notif.service';

@Injectable({ providedIn: 'root' })
export class ModelNotifRoutingResolveService implements Resolve<IModelNotif | null> {
  constructor(protected service: ModelNotifService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IModelNotif | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((modelNotif: HttpResponse<IModelNotif>) => {
          if (modelNotif.body) {
            return of(modelNotif.body);
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
