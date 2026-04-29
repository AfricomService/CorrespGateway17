import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IModelNotif, NewModelNotif } from '../model-notif.model';

export type PartialUpdateModelNotif = Partial<IModelNotif> & Pick<IModelNotif, 'id'>;

type RestOf<T extends IModelNotif | NewModelNotif> = Omit<T, 'createdDate'> & {
  createdDate?: string | null;
};

export type RestModelNotif = RestOf<IModelNotif>;

export type NewRestModelNotif = RestOf<NewModelNotif>;

export type PartialUpdateRestModelNotif = RestOf<PartialUpdateModelNotif>;

export type EntityResponseType = HttpResponse<IModelNotif>;
export type EntityArrayResponseType = HttpResponse<IModelNotif[]>;

@Injectable({ providedIn: 'root' })
export class ModelNotifService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/model-notifs', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(modelNotif: NewModelNotif): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(modelNotif);
    return this.http
      .post<RestModelNotif>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(modelNotif: IModelNotif): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(modelNotif);
    return this.http
      .put<RestModelNotif>(`${this.resourceUrl}/${this.getModelNotifIdentifier(modelNotif)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(modelNotif: PartialUpdateModelNotif): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(modelNotif);
    return this.http
      .patch<RestModelNotif>(`${this.resourceUrl}/${this.getModelNotifIdentifier(modelNotif)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<RestModelNotif>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestModelNotif[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  queryByFamilleEmail(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestModelNotif[]>(`${this.resourceUrl}/by-famille-email`, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getModelNotifIdentifier(modelNotif: Pick<IModelNotif, 'id'>): string {
    return modelNotif.id;
  }

  compareModelNotif(o1: Pick<IModelNotif, 'id'> | null, o2: Pick<IModelNotif, 'id'> | null): boolean {
    return o1 && o2 ? this.getModelNotifIdentifier(o1) === this.getModelNotifIdentifier(o2) : o1 === o2;
  }

  addModelNotifToCollectionIfMissing<Type extends Pick<IModelNotif, 'id'>>(
    modelNotifCollection: Type[],
    ...modelNotifsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const modelNotifs: Type[] = modelNotifsToCheck.filter(isPresent);
    if (modelNotifs.length > 0) {
      const modelNotifCollectionIdentifiers = modelNotifCollection.map(modelNotifItem => this.getModelNotifIdentifier(modelNotifItem)!);
      const modelNotifsToAdd = modelNotifs.filter(modelNotifItem => {
        const modelNotifIdentifier = this.getModelNotifIdentifier(modelNotifItem);
        if (modelNotifCollectionIdentifiers.includes(modelNotifIdentifier)) {
          return false;
        }
        modelNotifCollectionIdentifiers.push(modelNotifIdentifier);
        return true;
      });
      return [...modelNotifsToAdd, ...modelNotifCollection];
    }
    return modelNotifCollection;
  }

  protected convertDateFromClient<T extends IModelNotif | NewModelNotif | PartialUpdateModelNotif>(modelNotif: T): RestOf<T> {
    return {
      ...modelNotif,
      createdDate: modelNotif.createdDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restModelNotif: RestModelNotif): IModelNotif {
    return {
      ...restModelNotif,
      createdDate: restModelNotif.createdDate ? dayjs(restModelNotif.createdDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestModelNotif>): HttpResponse<IModelNotif> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestModelNotif[]>): HttpResponse<IModelNotif[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
