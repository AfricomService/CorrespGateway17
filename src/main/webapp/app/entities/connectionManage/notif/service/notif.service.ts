import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { INotif, NewNotif } from '../notif.model';

export type PartialUpdateNotif = Partial<INotif> & Pick<INotif, 'id'>;

type RestOf<T extends INotif | NewNotif> = Omit<T, 'sentDate'> & {
  sentDate?: string | null;
};

export type RestNotif = RestOf<INotif>;

export type NewRestNotif = RestOf<NewNotif>;

export type PartialUpdateRestNotif = RestOf<PartialUpdateNotif>;

export type EntityResponseType = HttpResponse<INotif>;
export type EntityArrayResponseType = HttpResponse<INotif[]>;

@Injectable({ providedIn: 'root' })
export class NotifService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/notifs', 'connectionmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(notif: NewNotif): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(notif);
    return this.http.post<RestNotif>(this.resourceUrl, copy, { observe: 'response' }).pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(notif: INotif): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(notif);
    return this.http
      .put<RestNotif>(`${this.resourceUrl}/${this.getNotifIdentifier(notif)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(notif: PartialUpdateNotif): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(notif);
    return this.http
      .patch<RestNotif>(`${this.resourceUrl}/${this.getNotifIdentifier(notif)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<RestNotif>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestNotif[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getNotifIdentifier(notif: Pick<INotif, 'id'>): string {
    return notif.id;
  }

  compareNotif(o1: Pick<INotif, 'id'> | null, o2: Pick<INotif, 'id'> | null): boolean {
    return o1 && o2 ? this.getNotifIdentifier(o1) === this.getNotifIdentifier(o2) : o1 === o2;
  }

  addNotifToCollectionIfMissing<Type extends Pick<INotif, 'id'>>(
    notifCollection: Type[],
    ...notifsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const notifs: Type[] = notifsToCheck.filter(isPresent);
    if (notifs.length > 0) {
      const notifCollectionIdentifiers = notifCollection.map(notifItem => this.getNotifIdentifier(notifItem)!);
      const notifsToAdd = notifs.filter(notifItem => {
        const notifIdentifier = this.getNotifIdentifier(notifItem);
        if (notifCollectionIdentifiers.includes(notifIdentifier)) {
          return false;
        }
        notifCollectionIdentifiers.push(notifIdentifier);
        return true;
      });
      return [...notifsToAdd, ...notifCollection];
    }
    return notifCollection;
  }

  protected convertDateFromClient<T extends INotif | NewNotif | PartialUpdateNotif>(notif: T): RestOf<T> {
    return {
      ...notif,
      sentDate: notif.sentDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restNotif: RestNotif): INotif {
    return {
      ...restNotif,
      sentDate: restNotif.sentDate ? dayjs(restNotif.sentDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestNotif>): HttpResponse<INotif> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestNotif[]>): HttpResponse<INotif[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
