import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPj, NewPj } from '../pj.model';

export type PartialUpdatePj = Partial<IPj> & Pick<IPj, 'id'>;

type RestOf<T extends IPj | NewPj> = Omit<T, 'creationDate' | 'updatedDate'> & {
  creationDate?: string | null;
  updatedDate?: string | null;
};

export type RestPj = RestOf<IPj>;

export type NewRestPj = RestOf<NewPj>;

export type PartialUpdateRestPj = RestOf<PartialUpdatePj>;

export type EntityResponseType = HttpResponse<IPj>;
export type EntityArrayResponseType = HttpResponse<IPj[]>;

@Injectable({ providedIn: 'root' })
export class PjService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/pjs', 'correspmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(pj: NewPj): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(pj);
    return this.http.post<RestPj>(this.resourceUrl, copy, { observe: 'response' }).pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(pj: IPj): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(pj);
    return this.http
      .put<RestPj>(`${this.resourceUrl}/${this.getPjIdentifier(pj)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(pj: PartialUpdatePj): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(pj);
    return this.http
      .patch<RestPj>(`${this.resourceUrl}/${this.getPjIdentifier(pj)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestPj>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestPj[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  getAllPjByCorrespId(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestPj[]>(`${this.resourceUrl}ByCorrespId`, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  getFile(pjId: number): Observable<Blob> {
    return this.http.get(`${this.resourceUrl}/getFile?pjId=${pjId}`, {
      responseType: 'blob',
    });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getPjIdentifier(pj: Pick<IPj, 'id'>): number {
    return pj.id;
  }

  comparePj(o1: Pick<IPj, 'id'> | null, o2: Pick<IPj, 'id'> | null): boolean {
    return o1 && o2 ? this.getPjIdentifier(o1) === this.getPjIdentifier(o2) : o1 === o2;
  }

  addPjToCollectionIfMissing<Type extends Pick<IPj, 'id'>>(pjCollection: Type[], ...pjsToCheck: (Type | null | undefined)[]): Type[] {
    const pjs: Type[] = pjsToCheck.filter(isPresent);
    if (pjs.length > 0) {
      const pjCollectionIdentifiers = pjCollection.map(pjItem => this.getPjIdentifier(pjItem)!);
      const pjsToAdd = pjs.filter(pjItem => {
        const pjIdentifier = this.getPjIdentifier(pjItem);
        if (pjCollectionIdentifiers.includes(pjIdentifier)) {
          return false;
        }
        pjCollectionIdentifiers.push(pjIdentifier);
        return true;
      });
      return [...pjsToAdd, ...pjCollection];
    }
    return pjCollection;
  }

  protected convertDateFromClient<T extends IPj | NewPj | PartialUpdatePj>(pj: T): RestOf<T> {
    return {
      ...pj,
      creationDate: pj.creationDate?.toJSON() ?? null,
      updatedDate: pj.updatedDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restPj: RestPj): IPj {
    return {
      ...restPj,
      creationDate: restPj.creationDate ? dayjs(restPj.creationDate) : undefined,
      updatedDate: restPj.updatedDate ? dayjs(restPj.updatedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestPj>): HttpResponse<IPj> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestPj[]>): HttpResponse<IPj[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }

  // uploadPj(file: File, req?: any): Observable<string> {
  //   const options = createRequestOption(req);
  //
  //   const formData: FormData = new FormData();
  //   formData.append('file', file);
  //
  //   return this.http.post(`${this.resourceUrl}/uploadPj`, formData, { params: options, responseType: 'text' });
  // }

  uploadPj(file: File, req?: any): Observable<number | string> {
    const options = createRequestOption(req);

    const formData: FormData = new FormData();
    formData.append('file', file);

    return this.http
      .post(`${this.resourceUrl}/uploadPj`, formData, {
        params: options,
        responseType: 'text',
        reportProgress: true, // Enable progress reporting
        observe: 'events', // Observe all HTTP events
      })
      .pipe(
        map((event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Calculate progress percentage
            const percentDone = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            return percentDone;
          } else if (event.type === HttpEventType.Response) {
            // Upload complete, return response body
            return event.body;
          }
          return 0; // For other event types
        })
      );
  }
  deletePj(req?: any): Observable<HttpResponse<{}>> {
    const options = createRequestOption(req);
    return this.http.delete<{}>(this.resourceUrl, { params: options, observe: 'response' });
  }

  deletePjWithCorresp(req?: any): Observable<HttpResponse<{}>> {
    const options = createRequestOption(req);
    return this.http.delete<{}>(`${this.resourceUrl}WithCorresp`, { params: options, observe: 'response' });
  }
}
