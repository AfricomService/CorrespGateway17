import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IHistAction, NewHistAction } from '../hist-action.model';

export type PartialUpdateHistAction = Partial<IHistAction> & Pick<IHistAction, 'id'>;

type RestOf<T extends IHistAction | NewHistAction> = Omit<T, 'dateTransaction'> & {
  dateTransaction?: string | null;
};

export type RestHistAction = RestOf<IHistAction>;

export type NewRestHistAction = RestOf<NewHistAction>;

export type PartialUpdateRestHistAction = RestOf<PartialUpdateHistAction>;

export type EntityResponseType = HttpResponse<IHistAction>;
export type EntityArrayResponseType = HttpResponse<IHistAction[]>;

@Injectable({ providedIn: 'root' })
export class HistActionService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/hist-actions', 'journaux');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(histAction: NewHistAction): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(histAction);
    return this.http
      .post<RestHistAction>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(histAction: IHistAction): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(histAction);
    return this.http
      .put<RestHistAction>(`${this.resourceUrl}/${this.getHistActionIdentifier(histAction)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(histAction: PartialUpdateHistAction): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(histAction);
    return this.http
      .patch<RestHistAction>(`${this.resourceUrl}/${this.getHistActionIdentifier(histAction)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestHistAction>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestHistAction[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getHistActionIdentifier(histAction: Pick<IHistAction, 'id'>): number {
    return histAction.id;
  }

  compareHistAction(o1: Pick<IHistAction, 'id'> | null, o2: Pick<IHistAction, 'id'> | null): boolean {
    return o1 && o2 ? this.getHistActionIdentifier(o1) === this.getHistActionIdentifier(o2) : o1 === o2;
  }

  addHistActionToCollectionIfMissing<Type extends Pick<IHistAction, 'id'>>(
    histActionCollection: Type[],
    ...histActionsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const histActions: Type[] = histActionsToCheck.filter(isPresent);
    if (histActions.length > 0) {
      const histActionCollectionIdentifiers = histActionCollection.map(histActionItem => this.getHistActionIdentifier(histActionItem)!);
      const histActionsToAdd = histActions.filter(histActionItem => {
        const histActionIdentifier = this.getHistActionIdentifier(histActionItem);
        if (histActionCollectionIdentifiers.includes(histActionIdentifier)) {
          return false;
        }
        histActionCollectionIdentifiers.push(histActionIdentifier);
        return true;
      });
      return [...histActionsToAdd, ...histActionCollection];
    }
    return histActionCollection;
  }

  protected convertDateFromClient<T extends IHistAction | NewHistAction | PartialUpdateHistAction>(histAction: T): RestOf<T> {
    return {
      ...histAction,
      dateTransaction: histAction.dateTransaction?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restHistAction: RestHistAction): IHistAction {
    return {
      ...restHistAction,
      dateTransaction: restHistAction.dateTransaction ? dayjs(restHistAction.dateTransaction) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestHistAction>): HttpResponse<IHistAction> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestHistAction[]>): HttpResponse<IHistAction[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
