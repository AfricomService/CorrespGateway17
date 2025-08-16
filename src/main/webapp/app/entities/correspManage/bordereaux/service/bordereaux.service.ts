import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IBordereaux, NewBordereaux } from '../bordereaux.model';

export type PartialUpdateBordereaux = Partial<IBordereaux> & Pick<IBordereaux, 'id'>;

type RestOf<T extends IBordereaux | NewBordereaux> = Omit<T, 'issuedDate' | 'dueDate' | 'createdDate' | 'updatedDate'> & {
  issuedDate?: string | null;
  dueDate?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
};

export type RestBordereaux = RestOf<IBordereaux>;

export type NewRestBordereaux = RestOf<NewBordereaux>;

export type PartialUpdateRestBordereaux = RestOf<PartialUpdateBordereaux>;

export type EntityResponseType = HttpResponse<IBordereaux>;
export type EntityArrayResponseType = HttpResponse<IBordereaux[]>;

@Injectable({ providedIn: 'root' })
export class BordereauxService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/bordereaux', 'correspmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(bordereaux: NewBordereaux): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(bordereaux);
    return this.http
      .post<RestBordereaux>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(bordereaux: IBordereaux): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(bordereaux);
    return this.http
      .put<RestBordereaux>(`${this.resourceUrl}/${this.getBordereauxIdentifier(bordereaux)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(bordereaux: PartialUpdateBordereaux): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(bordereaux);
    return this.http
      .patch<RestBordereaux>(`${this.resourceUrl}/${this.getBordereauxIdentifier(bordereaux)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestBordereaux>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestBordereaux[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getBordereauxIdentifier(bordereaux: Pick<IBordereaux, 'id'>): number {
    return bordereaux.id;
  }

  compareBordereaux(o1: Pick<IBordereaux, 'id'> | null, o2: Pick<IBordereaux, 'id'> | null): boolean {
    return o1 && o2 ? this.getBordereauxIdentifier(o1) === this.getBordereauxIdentifier(o2) : o1 === o2;
  }

  addBordereauxToCollectionIfMissing<Type extends Pick<IBordereaux, 'id'>>(
    bordereauxCollection: Type[],
    ...bordereauxToCheck: (Type | null | undefined)[]
  ): Type[] {
    const bordereaux: Type[] = bordereauxToCheck.filter(isPresent);
    if (bordereaux.length > 0) {
      const bordereauxCollectionIdentifiers = bordereauxCollection.map(bordereauxItem => this.getBordereauxIdentifier(bordereauxItem)!);
      const bordereauxToAdd = bordereaux.filter(bordereauxItem => {
        const bordereauxIdentifier = this.getBordereauxIdentifier(bordereauxItem);
        if (bordereauxCollectionIdentifiers.includes(bordereauxIdentifier)) {
          return false;
        }
        bordereauxCollectionIdentifiers.push(bordereauxIdentifier);
        return true;
      });
      return [...bordereauxToAdd, ...bordereauxCollection];
    }
    return bordereauxCollection;
  }

  protected convertDateFromClient<T extends IBordereaux | NewBordereaux | PartialUpdateBordereaux>(bordereaux: T): RestOf<T> {
    return {
      ...bordereaux,
      issuedDate: bordereaux.issuedDate?.toJSON() ?? null,
      dueDate: bordereaux.dueDate?.toJSON() ?? null,
      createdDate: bordereaux.createdDate?.toJSON() ?? null,
      updatedDate: bordereaux.updatedDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restBordereaux: RestBordereaux): IBordereaux {
    return {
      ...restBordereaux,
      issuedDate: restBordereaux.issuedDate ? dayjs(restBordereaux.issuedDate) : undefined,
      dueDate: restBordereaux.dueDate ? dayjs(restBordereaux.dueDate) : undefined,
      createdDate: restBordereaux.createdDate ? dayjs(restBordereaux.createdDate) : undefined,
      updatedDate: restBordereaux.updatedDate ? dayjs(restBordereaux.updatedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestBordereaux>): HttpResponse<IBordereaux> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestBordereaux[]>): HttpResponse<IBordereaux[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
