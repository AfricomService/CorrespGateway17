import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ICorresp, NewCorresp } from '../corresp.model';
import { ITasks } from '../../tasks/tasks.model';
import { IPj } from '../../pj/pj.model';
import { IOrga } from '../orga';
import { DepartementTreeFeignDTO } from '../update/DepartementTreeFeignDTO';
import { IDepartement } from '../../../orgacare/departement/departement.model';
import { organigrammeFeignDTO } from '../update/organigrammeFeignDTO';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';

export type PartialUpdateCorresp = Partial<ICorresp> & Pick<ICorresp, 'id'>;

type RestOf<T extends ICorresp | NewCorresp> = Omit<T, 'dateCreated' | 'courrierDate' | 'updatedDate'> & {
  dateCreated?: string | null;
  courrierDate?: string | null;
  updatedDate?: string | null;
};

interface IFileUpload {
  fileId: string;
  uniqueFileName: string;
}

export type RestCorresp = RestOf<ICorresp>;

export type NewRestCorresp = RestOf<NewCorresp>;

export type PartialUpdateRestCorresp = RestOf<PartialUpdateCorresp>;

export type EntityResponseType = HttpResponse<ICorresp>;
export type EntityArrayResponseType = HttpResponse<ICorresp[]>;

@Injectable({ providedIn: 'root' })
export class CorrespService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/corresps', 'correspmanage');
  protected resourceUrlOrganigramme = this.applicationConfigService.getEndpointFor('api/orgacares', 'configmanage');
  protected resourceUrlDepartementsFromOrgaCare = this.applicationConfigService.getEndpointFor(
    'api/DepartementsFromOrgaCare',
    'configmanage'
  );
  protected resourceUrlOrganigrammesFromOrgaCare = this.applicationConfigService.getEndpointFor(
    'api/OrganigrammesFromOrgaCare',
    'configmanage'
  );

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(corresp: NewCorresp): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(corresp);
    return this.http
      .post<RestCorresp>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(corresp: ICorresp): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(corresp);
    return this.http
      .put<RestCorresp>(`${this.resourceUrl}/${this.getCorrespIdentifier(corresp)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(corresp: PartialUpdateCorresp): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(corresp);
    return this.http
      .patch<RestCorresp>(`${this.resourceUrl}/${this.getCorrespIdentifier(corresp)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestCorresp>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }
  getAllDepartements(): Observable<IDepartement[]> {
    return this.http.get<IDepartement[]>(this.resourceUrl);
  }
  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestCorresp[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  queryOrga(): Observable<HttpResponse<IOrga[]>> {
    return this.http.get<IOrga[]>(this.resourceUrlOrganigramme, { observe: 'response' });
  }

  queryOrgaDeps(req?: any): Observable<HttpResponse<DepartementTreeFeignDTO[]>> {
    const options = createRequestOption(req);
    return this.http.get<DepartementTreeFeignDTO[]>(this.resourceUrlDepartementsFromOrgaCare, { params: options, observe: 'response' });
  }

  queryOrgaDepsByCode(req?: any): Observable<HttpResponse<IDepartement>> {
    const options = createRequestOption(req);
    return this.http.get<IDepartement>(`${this.resourceUrlDepartementsFromOrgaCare}ByCode`, { params: options, observe: 'response' });
  }
  queryOrgaById(req?: any): Observable<HttpResponse<organigrammeFeignDTO[]>> {
    const options = createRequestOption(req);
    return this.http.get<organigrammeFeignDTO[]>(this.resourceUrlOrganigrammesFromOrgaCare, { params: options, observe: 'response' });
  }

  getOrgaCodeByDeptCode(req?: any): Observable<HttpResponse<string>> {
    const options = createRequestOption(req);
    return this.http.get<string>(`${this.resourceUrlOrganigrammesFromOrgaCare}ByCodeDept`, {
      params: options,
      observe: 'response',
      responseType: 'text' as 'json',
    });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}Delete/${id}`, { observe: 'response' });
  }

  getCorrespIdentifier(corresp: Pick<ICorresp, 'id'>): number {
    return corresp.id;
  }

  compareCorresp(o1: Pick<ICorresp, 'id'> | null, o2: Pick<ICorresp, 'id'> | null): boolean {
    return o1 && o2 ? this.getCorrespIdentifier(o1) === this.getCorrespIdentifier(o2) : o1 === o2;
  }

  addCorrespToCollectionIfMissing<Type extends Pick<ICorresp, 'id'>>(
    correspCollection: Type[],
    ...correspsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const corresps: Type[] = correspsToCheck.filter(isPresent);
    if (corresps.length > 0) {
      const correspCollectionIdentifiers = correspCollection.map(correspItem => this.getCorrespIdentifier(correspItem)!);
      const correspsToAdd = corresps.filter(correspItem => {
        const correspIdentifier = this.getCorrespIdentifier(correspItem);
        if (correspCollectionIdentifiers.includes(correspIdentifier)) {
          return false;
        }
        correspCollectionIdentifiers.push(correspIdentifier);
        return true;
      });
      return [...correspsToAdd, ...correspCollection];
    }
    return correspCollection;
  }

  protected convertDateFromClient<T extends ICorresp | NewCorresp | PartialUpdateCorresp>(corresp: T): RestOf<T> {
    return {
      ...corresp,
      dateCreated: corresp.dateCreated?.toJSON() ?? null,
      courrierDate: corresp.courrierDate?.toJSON() ?? null,
      updatedDate: corresp.updatedDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restCorresp: RestCorresp): ICorresp {
    return {
      ...restCorresp,
      dateCreated: restCorresp.dateCreated ? dayjs(restCorresp.dateCreated) : undefined,
      courrierDate: restCorresp.courrierDate ? dayjs(restCorresp.courrierDate) : undefined,
      updatedDate: restCorresp.updatedDate ? dayjs(restCorresp.updatedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestCorresp>): HttpResponse<ICorresp> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestCorresp[]>): HttpResponse<ICorresp[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }

  // ------------------------------------------------------------------
  updateCorrespDraft(id: number, correspDTO: any, typeDocumentDTO: any): Observable<HttpResponse<ICorresp>> {
    const formData: FormData = new FormData();

    formData.append('correspDTO', new Blob([JSON.stringify(correspDTO)], { type: 'application/json' }));
    formData.append('typeDocumentDTO', new Blob([JSON.stringify(typeDocumentDTO)], { type: 'application/json' }));

    return this.http.put<ICorresp>(`${this.resourceUrl}/update/${id}`, formData, {
      observe: 'response',
    });
  }

  saveCorrespWithTasksAndPj(correspDTO: ICorresp, tasksDTOS: ITasks[], pjs: IPj[], typeDocumentDTO?: ITypedocument, withRef?: boolean) {
    const formData = new FormData();

    formData.append('correspDTO', new Blob([JSON.stringify(correspDTO)], { type: 'application/json' }));
    formData.append('tasksDTOS', new Blob([JSON.stringify(tasksDTOS)], { type: 'application/json' }));
    formData.append('pjs', new Blob([JSON.stringify(pjs)], { type: 'application/json' }));
    formData.append('typeDoc', new Blob([JSON.stringify(typeDocumentDTO)], { type: 'application/json' }));

    formData.append('withRef', new Blob([JSON.stringify(withRef)], { type: 'application/json' }));

    return this.http.post(`${this.resourceUrl}WithTasksAndPjs`, formData);
  }

  addTaskToCorresp(tasksDTO: ITasks, correspId: number) {
    const formData = new FormData();

    formData.append('correspId', correspId.toString());

    formData.append('tasksDTO', new Blob([JSON.stringify(tasksDTO)], { type: 'application/json' }));

    return this.http.post(`${this.resourceUrl}AddTaskToCorresp`, formData);
  }

  addPjToCorresp(pjDto: IPj, correspId: number) {
    const formData = new FormData();

    formData.append('correspId', correspId.toString());

    formData.append('pjDTO', new Blob([JSON.stringify(pjDto)], { type: 'application/json' }));

    return this.http.post(`${this.resourceUrl}AddPjToCorresp`, formData);
  }

  changeTaskStatus(req?: any) {
    const options = createRequestOption(req);

    return this.http.patch(`${this.resourceUrl}ChangeTaskStatus`, options);
  }
  generateReferenceForCorresp(id: number): Observable<ICorresp> {
    return this.http.patch<ICorresp>(`${this.resourceUrl}/${id}/generateReference`, {});
  }

  soumettreCorresp(req?: any) {
    const options = createRequestOption(req);

    return this.http.patch(`${this.resourceUrl}SoumettreCorresp`, options);
  }

  cloturerCorresp(req?: any) {
    const options = createRequestOption(req);

    return this.http.patch(`${this.resourceUrl}CloturerCorresp`, options);
  }

  loadBodyFromFile(req?: any) {
    const options = createRequestOption(req);

    return this.http.get(`${this.resourceUrl}/loadBodyFromFile`, { params: options, responseType: 'text' });
  }

  saveBodyToFile(req?: any) {
    const options = createRequestOption(req);

    return this.http.patch(`${this.resourceUrl}/saveBodyToFile`, options);
  }

  getCorrespsByTask(taskId: number): Observable<EntityArrayResponseType> {
    return this.http
      .get<RestCorresp[]>(`${this.resourceUrl}/by-task/${taskId}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }
}
