import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ICorresp, NewCorresp } from '../corresp.model';
import { ITasks } from '../../tasks/tasks.model';
import { IPj } from '../../pj/pj.model';
import { IMessage } from '../../message/message.model';
import { IOrga } from '../orga';
import { DepartementTreeFeignDTO } from '../update/DepartementTreeFeignDTO';
import { IDepartement } from '../../../orgacare/departement/departement.model';
import { organigrammeFeignDTO } from '../update/organigrammeFeignDTO';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { CorrespPermissionsDTO } from '../../permissions.model';
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

export interface CorrespSummaryDTO {
  subject?: string | null;
  reference?: string | null;
}

export interface DepartementAffectationDTO {
  codeDepartement?: string;
  nomDepartement?: string;
  typeAffectation?: string;
  email?: string;
}

// Interface pour la réponse paginée
export interface PagedCorrespResponse {
  content: ICorresp[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
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
  // url pour l'endpoint qui renvoie l'arbre de départements (service orgacare)
  protected resourceUrlDepartementHierarchy = this.applicationConfigService.getEndpointFor('api/departementshierarchy', 'orgacare');
  protected resourceUrlDepartementTree = this.applicationConfigService.getEndpointFor('api/departements/tree', 'orgacare');
  protected resourceUrlMessages = this.applicationConfigService.getEndpointFor('api/messages', 'correspmanage');

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

  getDepartementHierarchyByOrganigramme(organigrammeCode: string): Observable<HttpResponse<DepartementTreeFeignDTO[]>> {
    // on met observe: 'response' pour garder headers + status si besoin
    return this.http.get<DepartementTreeFeignDTO[]>(`${this.resourceUrlDepartementHierarchy}/${encodeURIComponent(organigrammeCode)}`, {
      observe: 'response',
    });
  }

  getDepartementTreeOnlyByOrganigramme(organigrammeCode: string): Observable<HttpResponse<DepartementTreeFeignDTO[]>> {
    return this.http.get<DepartementTreeFeignDTO[]>(`${this.resourceUrlDepartementTree}/${encodeURIComponent(organigrammeCode)}`, {
      observe: 'response',
    });
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

  /**
   * Appelle GET /api/corresps/dispatched
   * Retourne la full HttpResponse contenant le tableau de Corresp (avec conversion des dates).
   */
  getAllDispatched(): Observable<EntityArrayResponseType> {
    return this.http.get<RestCorresp[]>(`${this.resourceUrl}/dispatched`, { observe: 'response' }).pipe(
      // conversion des dates du serveur vers dayjs (réutilise ton helper)
      map(res => this.convertResponseArrayFromServer(res)),
      // en cas d'erreur, renvoyer une réponse vide afin de ne pas casser l'UI
      catchError(() => of(new HttpResponse<ICorresp[]>({ body: [] })))
    );
  }

  /**
   * Variante pratique — renvoie directement la liste (ICorresp[]) sans HttpResponse,
   * plus simple à consommer dans les composants.
   */
  getAllDispatchedList(): Observable<ICorresp[]> {
    return this.getAllDispatched().pipe(
      map(resp => resp.body ?? []),
      // si tu préfères une valeur par défaut vide en cas d'erreur
      catchError(() => of([]))
    );
  }

  /**
   * GET /api/corresps-filter?userId=...&pageIndex=...&pageSize=...&...filtres
   * Remplace findAllCorrespByFilter + findAllByStatusDispatch (unifié côté backend)
   */
  getCorrespsFiltered(
    userId: number,
    pageIndex: number = 1,
    pageSize: number = 15,
    filters?: {
      reference?: string;
      status?: string;
      dispatchType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<PagedCorrespResponse> {
    let params: any = { userId, pageIndex, pageSize };

    if (filters) {
      if (filters.reference) params['reference'] = filters.reference;
      if (filters.status) params['status'] = filters.status;
      if (filters.dispatchType) params['dispatchType'] = filters.dispatchType;
      if (filters.startDate) params['startDate'] = filters.startDate;
      if (filters.endDate) params['endDate'] = filters.endDate;
    }

    const httpParams = createRequestOption(params);

    return this.http
      .get<any>(`${this.applicationConfigService.getEndpointFor('api/corresps-filter', 'correspmanage')}`, { params: httpParams })
      .pipe(
        map(response => ({
          content: (response.content ?? []).map((item: RestCorresp) => this.convertDateFromServer(item)),
          currentPage: response.currentPage,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
          hasNext: response.hasNext,
          hasPrevious: response.hasPrevious,
        })),
        catchError(() =>
          of({
            content: [],
            currentPage: pageIndex,
            pageSize: pageSize,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          })
        )
      );
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

  //addTaskToCorresp(tasksDTO: ITasks, correspId: number) {
  //  const formData = new FormData();

  // formData.append('correspId', correspId.toString());

  //  formData.append('tasksDTO', new Blob([JSON.stringify(tasksDTO)], { type: 'application/json' }));

  //  return this.http.post(`${this.resourceUrl}AddTaskToCorresp`, formData);
  // }

  /**
   * Convertit les champs date d'une tâche avant envoi au serveur (ISO string).
   * Adapte les champs selon ton ITasks (ici on gère les dates les plus courantes).
   */
  protected convertTaskDateFromClient(task: ITasks): any {
    return {
      ...task,
      creationDate: task.creationDate ? (task.creationDate as any).toJSON?.() ?? task.creationDate : null,
      startDate: task.startDate ? (task.startDate as any).toJSON?.() ?? task.startDate : null,
      dueDate: task.dueDate ? (task.dueDate as any).toJSON?.() ?? task.dueDate : null,
      closeDate: task.closeDate ? (task.closeDate as any).toJSON?.() ?? task.closeDate : null,
      updatedDate: task.updatedDate ? (task.updatedDate as any).toJSON?.() ?? task.updatedDate : null,
    };
  }

  /**
   * Appelle POST /api/corresps/{correspId}/tasks
   * Envoie un TasksDTO (ITasks) en JSON. Retourne le Corresp mis à jour (avec headers si besoin).
   */
  addTaskToCorresp(tasksDTO: ITasks, correspId: number): Observable<HttpResponse<ICorresp>> {
    const copy = this.convertTaskDateFromClient(tasksDTO);
    return this.http
      .post<RestCorresp>(`${this.resourceUrl}/${correspId}/tasks`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
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

  getCorrespSummaryByTask(taskId: number): Observable<{ subject?: string | null; reference?: string | null }> {
    return this.http.get<{ subject?: string | null; reference?: string | null }>(`${this.resourceUrl}/by-task/${taskId}/summary`);
  }

  getDepartementAffectationsByUser(userId: number): Observable<DepartementAffectationDTO[]> {
    return this.http.get<DepartementAffectationDTO[]>(
      `${this.applicationConfigService.getEndpointFor('api/departements/user', 'orgacare')}/${userId}/affectations`
    );
  }

  getCorrespSummariesByTasks(taskIds: number[]): Observable<Record<string, CorrespSummaryDTO>> {
    return this.http.post<Record<string, CorrespSummaryDTO>>(`${this.resourceUrl}/summaries-by-tasks`, taskIds);
  }

  /**
   * Liste complète (non paginée) des corresps ayant une reference non-nulle.
   * GET /api/corresps/with-reference/list
   */
  getAllWithReferenceList(): Observable<EntityArrayResponseType> {
    return this.http
      .get<RestCorresp[]>(`${this.resourceUrl}/with-reference/list`, { observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  /**
   * Page des corresps ayant une reference non-nulle (paginée).
   * GET /api/corresps/with-reference?page=1&size=20
   * page = 1-based (comme dans ton service backend)
   */
  getAllWithReference(page: number = 1, size: number = 20): Observable<EntityArrayResponseType> {
    const options = createRequestOption({ page, size });
    return this.http
      .get<RestCorresp[]>(`${this.resourceUrl}/with-reference`, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  getPermissions(correspId: number): Observable<CorrespPermissionsDTO> {
    return this.http.get<CorrespPermissionsDTO>(`${this.resourceUrl}/${correspId}/permissions`);
  }

  getCorrespsByUserAcl(userId: number): Observable<EntityArrayResponseType> {
    const params = createRequestOption({ userId });
    return this.http
      .get<RestCorresp[]>(`${this.resourceUrl}/correspsByUserAcl`, { params, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  // Dans la classe CorrespService, ajouter cette méthode :
  getCorrespsByUserAclPaged(userId: number, page: number = 1, size: number = 15): Observable<PagedCorrespResponse> {
    const params = createRequestOption({ userId, page, size });
    return this.http.get<any>(`${this.resourceUrl}/correspsByUserAclPaged`, { params }).pipe(
      map(response => ({
        content: (response.content ?? []).map((item: RestCorresp) => this.convertDateFromServer(item)),
        currentPage: response.currentPage,
        pageSize: response.pageSize,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious,
      })),
      catchError(() =>
        of({
          content: [],
          currentPage: page,
          pageSize: size,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        })
      )
    );
  }

  /**
   * GET /api/messages/by-corresp/{correspId}
   * L'API backend retourne un seul MessageDTO (ou 404 si aucun message).
   * On wrappe le résultat dans un tableau pour garder la compatibilité avec le composant.
   */
  getMessagesByCorrespId(correspId: number): Observable<HttpResponse<IMessage[]>> {
    return this.http.get<IMessage>(`${this.resourceUrlMessages}/by-corresp/${correspId}`, { observe: 'response' }).pipe(
      map(res => {
        // Wrapper le message unique dans un tableau
        const body: IMessage[] = res.body ? [res.body] : [];
        return res.clone({ body });
      }),
      catchError(err => {
        console.warn(`[CorrespService] Erreur chargement message pour correspId=${correspId}:`, err?.status, err?.message);
        return of(new HttpResponse<IMessage[]>({ body: [] }));
      })
    );
  }
}
