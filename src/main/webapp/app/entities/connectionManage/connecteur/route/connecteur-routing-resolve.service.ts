import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IConnecteur } from '../connecteur.model';
import { ConnecteurService } from '../service/connecteur.service';

@Injectable({ providedIn: 'root' })
export class ConnecteurRoutingResolveService implements Resolve<IConnecteur | null> {
  constructor(protected service: ConnecteurService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IConnecteur | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((connecteur: HttpResponse<IConnecteur>) => {
          if (connecteur.body) {
            return of(connecteur.body);
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
