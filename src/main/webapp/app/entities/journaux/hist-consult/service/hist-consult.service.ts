import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IHistConsult, NewHistConsult } from '../hist-consult.model';

export type PartialUpdateHistConsult = Partial<IHistConsult> & Pick<IHistConsult, 'id'>;

type RestOf<T extends IHistConsult | NewHistConsult> = Omit<T, 'dateTransaction'> & {
  dateTransaction?: string | null;
};

export type RestHistConsult = RestOf<IHistConsult>;

export type NewRestHistConsult = RestOf<NewHistConsult>;

export type PartialUpdateRestHistConsult = RestOf<PartialUpdateHistConsult>;

export type EntityResponseType = HttpResponse<IHistConsult>;
export type EntityArrayResponseType = HttpResponse<IHistConsult[]>;

@Injectable({ providedIn: 'root' })
export class HistConsultService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/hist-consults', 'journaux');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(histConsult: NewHistConsult): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(histConsult);
    return this.http
      .post<RestHistConsult>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(histConsult: IHistConsult): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(histConsult);
    return this.http
      .put<RestHistConsult>(`${this.resourceUrl}/${this.getHistConsultIdentifier(histConsult)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(histConsult: PartialUpdateHistConsult): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(histConsult);
    return this.http
      .patch<RestHistConsult>(`${this.resourceUrl}/${this.getHistConsultIdentifier(histConsult)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestHistConsult>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestHistConsult[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getHistConsultIdentifier(histConsult: Pick<IHistConsult, 'id'>): number {
    return histConsult.id;
  }

  compareHistConsult(o1: Pick<IHistConsult, 'id'> | null, o2: Pick<IHistConsult, 'id'> | null): boolean {
    return o1 && o2 ? this.getHistConsultIdentifier(o1) === this.getHistConsultIdentifier(o2) : o1 === o2;
  }

  addHistConsultToCollectionIfMissing<Type extends Pick<IHistConsult, 'id'>>(
    histConsultCollection: Type[],
    ...histConsultsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const histConsults: Type[] = histConsultsToCheck.filter(isPresent);
    if (histConsults.length > 0) {
      const histConsultCollectionIdentifiers = histConsultCollection.map(
        histConsultItem => this.getHistConsultIdentifier(histConsultItem)!
      );
      const histConsultsToAdd = histConsults.filter(histConsultItem => {
        const histConsultIdentifier = this.getHistConsultIdentifier(histConsultItem);
        if (histConsultCollectionIdentifiers.includes(histConsultIdentifier)) {
          return false;
        }
        histConsultCollectionIdentifiers.push(histConsultIdentifier);
        return true;
      });
      return [...histConsultsToAdd, ...histConsultCollection];
    }
    return histConsultCollection;
  }

  protected convertDateFromClient<T extends IHistConsult | NewHistConsult | PartialUpdateHistConsult>(histConsult: T): RestOf<T> {
    return {
      ...histConsult,
      dateTransaction: histConsult.dateTransaction?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restHistConsult: RestHistConsult): IHistConsult {
    return {
      ...restHistConsult,
      dateTransaction: restHistConsult.dateTransaction ? dayjs(restHistConsult.dateTransaction) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestHistConsult>): HttpResponse<IHistConsult> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestHistConsult[]>): HttpResponse<IHistConsult[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
