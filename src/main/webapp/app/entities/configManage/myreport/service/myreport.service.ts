import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IMyreport, NewMyreport } from '../myreport.model';

export type PartialUpdateMyreport = Partial<IMyreport> & Pick<IMyreport, 'id'>;

type RestOf<T extends IMyreport | NewMyreport> = Omit<T, 'dateCreated'> & {
  dateCreated?: string | null;
};

export type RestMyreport = RestOf<IMyreport>;

export type NewRestMyreport = RestOf<NewMyreport>;

export type PartialUpdateRestMyreport = RestOf<PartialUpdateMyreport>;

export type EntityResponseType = HttpResponse<IMyreport>;
export type EntityArrayResponseType = HttpResponse<IMyreport[]>;

@Injectable({ providedIn: 'root' })
export class MyreportService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/myreports', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(myreport: NewMyreport): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(myreport);
    return this.http
      .post<RestMyreport>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(myreport: IMyreport): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(myreport);
    return this.http
      .put<RestMyreport>(`${this.resourceUrl}/${this.getMyreportIdentifier(myreport)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(myreport: PartialUpdateMyreport): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(myreport);
    return this.http
      .patch<RestMyreport>(`${this.resourceUrl}/${this.getMyreportIdentifier(myreport)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestMyreport>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestMyreport[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getMyreportIdentifier(myreport: Pick<IMyreport, 'id'>): number {
    return myreport.id;
  }

  compareMyreport(o1: Pick<IMyreport, 'id'> | null, o2: Pick<IMyreport, 'id'> | null): boolean {
    return o1 && o2 ? this.getMyreportIdentifier(o1) === this.getMyreportIdentifier(o2) : o1 === o2;
  }

  addMyreportToCollectionIfMissing<Type extends Pick<IMyreport, 'id'>>(
    myreportCollection: Type[],
    ...myreportsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const myreports: Type[] = myreportsToCheck.filter(isPresent);
    if (myreports.length > 0) {
      const myreportCollectionIdentifiers = myreportCollection.map(myreportItem => this.getMyreportIdentifier(myreportItem)!);
      const myreportsToAdd = myreports.filter(myreportItem => {
        const myreportIdentifier = this.getMyreportIdentifier(myreportItem);
        if (myreportCollectionIdentifiers.includes(myreportIdentifier)) {
          return false;
        }
        myreportCollectionIdentifiers.push(myreportIdentifier);
        return true;
      });
      return [...myreportsToAdd, ...myreportCollection];
    }
    return myreportCollection;
  }

  protected convertDateFromClient<T extends IMyreport | NewMyreport | PartialUpdateMyreport>(myreport: T): RestOf<T> {
    return {
      ...myreport,
      dateCreated: myreport.dateCreated?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restMyreport: RestMyreport): IMyreport {
    return {
      ...restMyreport,
      dateCreated: restMyreport.dateCreated ? dayjs(restMyreport.dateCreated) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestMyreport>): HttpResponse<IMyreport> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestMyreport[]>): HttpResponse<IMyreport[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
