import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ITasks, NewTasks } from '../tasks.model';
import { DepartementTreeFeignDTO } from 'app/entities/correspManage/corresp/update/DepartementTreeFeignDTO';

// Interface pour la réponse paginée
export interface PagedTasksResponse {
  content: ITasks[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Société de l'utilisateur connecté (réponse de /api/tasks/mesSocietes)
export interface ISocieteLight {
  id: number;
  raisonSociale: string;
  abreviation?: string | null;
  codeSociete?: string | null;
  codeOrganigramme?: string | null;
  etat?: string | null;
}

export type PartialUpdateTasks = Partial<ITasks> & Pick<ITasks, 'id'>;

type RestOf<T extends ITasks | NewTasks> = Omit<T, 'creationDate' | 'startDate' | 'dueDate' | 'closeDate' | 'updatedDate'> & {
  creationDate?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  closeDate?: string | null;
  updatedDate?: string | null;
  datePriseEnCharge?: string | null;
};

export type RestTasks = RestOf<ITasks>;

export type NewRestTasks = RestOf<NewTasks>;

export type PartialUpdateRestTasks = RestOf<PartialUpdateTasks>;

export type EntityResponseType = HttpResponse<ITasks>;
export type EntityArrayResponseType = HttpResponse<ITasks[]>;

@Injectable({ providedIn: 'root' })
export class TasksService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/tasks', 'correspmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(tasks: NewTasks): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(tasks);
    return this.http.post<RestTasks>(this.resourceUrl, copy, { observe: 'response' }).pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(tasks: ITasks): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(tasks);
    return this.http
      .put<RestTasks>(`${this.resourceUrl}/${this.getTasksIdentifier(tasks)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(tasks: PartialUpdateTasks): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(tasks);
    return this.http
      .patch<RestTasks>(`${this.resourceUrl}/${this.getTasksIdentifier(tasks)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestTasks>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestTasks[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }
  getAllTasksByEtat(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestTasks[]>(`${this.resourceUrl}/tasksByEtat`, { params: options, observe: 'response' })
      .pipe(map((res: HttpResponse<RestTasks[]>) => this.convertResponseArrayFromServer(res)));
  }

  getAllTasksByCorrespId(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestTasks[]>(`${this.resourceUrl}/tasksByCorrespId`, { params: options, observe: 'response' })
      .pipe(map((res: HttpResponse<RestTasks[]>) => this.convertResponseArrayFromServer(res)));
  }

  getTasksByUserAcl(userId: string, status?: string): Observable<EntityArrayResponseType> {
    const params = createRequestOption({ userId, status });
    return this.http
      .get<RestTasks[]>(`${this.resourceUrl}/tasksByUserAcl`, { params, observe: 'response' })
      .pipe(map((res: HttpResponse<RestTasks[]>) => this.convertResponseArrayFromServer(res)));
  }

  getTasksByUserAclPaged(
    userId: string,
    status?: string,
    page: number = 1,
    size: number = 10,
    startDateFrom?: string,
    startDateTo?: string,
    includeChildren: boolean = false,
    deptCode?: string
  ): Observable<PagedTasksResponse> {
    const req: any = { userId, page, size };
    if (status) req.status = status;
    if (startDateFrom) req.startDateFrom = startDateFrom;
    if (startDateTo) req.startDateTo = startDateTo;
    if (includeChildren) req.includeChildren = true;
    if (deptCode) req.deptCode = deptCode;
    const params = createRequestOption(req);
    return this.http.get<any>(`${this.resourceUrl}/tasksByUserAclPaged`, { params }).pipe(
      map(response => ({
        content: (response.content ?? []).map((item: RestTasks) => this.convertDateFromServer(item)),
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

  exportTasksByUserAclPaged(
    userId: string,
    status?: string,
    startDateFrom?: string,
    startDateTo?: string,
    includeChildren: boolean = false,
    deptCode?: string,
    keyword?: string
  ): Observable<HttpResponse<Blob>> {
    const req: any = { userId };
    if (status) req.status = status;
    if (startDateFrom) req.startDateFrom = startDateFrom;
    if (startDateTo) req.startDateTo = startDateTo;
    if (includeChildren) req.includeChildren = true;
    if (deptCode) req.deptCode = deptCode;
    if (keyword) req.keyword = keyword;
    const params = createRequestOption(req);
    return this.http.get(`${this.resourceUrl}/tasksByUserAclPaged/export`, {
      params,
      responseType: 'blob',
      observe: 'response',
    }) as Observable<HttpResponse<Blob>>;
  }

  searchTasksByUserAcl(
    userId: string,
    keyword: string,
    includeChildren: boolean = false,
    deptCode?: string
  ): Observable<EntityArrayResponseType> {
    // On envoie le même mot-clé sur les deux champs : reference ET subject
    const req: any = { userId, reference: keyword, subject: keyword };
    if (includeChildren) req.includeChildren = true;
    if (deptCode) req.deptCode = deptCode;
    const params = createRequestOption(req);
    return this.http
      .get<RestTasks[]>(`${this.resourceUrl}/searchByUserAcl`, { params, observe: 'response' })
      .pipe(map((res: HttpResponse<RestTasks[]>) => this.convertResponseArrayFromServer(res)));
  }

  // Sociétés de l'utilisateur connecté (CorrespCare -> OrgaCare)
  getMesSocietes(): Observable<ISocieteLight[]> {
    return this.http.get<ISocieteLight[]>(`${this.resourceUrl}/mesSocietes`).pipe(catchError(() => of([])));
  }

  // Mon département + mes sous-départements, dans l'organigramme donné
  getMesDepartementsTree(userId: string, orgaCode: string): Observable<DepartementTreeFeignDTO[]> {
    const params = createRequestOption({ userId, orgaCode });
    return this.http.get<DepartementTreeFeignDTO[]>(`${this.resourceUrl}/mesDepartements`, { params }).pipe(catchError(() => of([])));
  }

  getAllTasksByUserAclAllStatuses(userId: string): Observable<EntityArrayResponseType> {
    const options = createRequestOption({ userId });
    return this.http
      .get<RestTasks[]>(`${this.resourceUrl}/tasksByUserAclAllStatuses`, { params: options, observe: 'response' })
      .pipe(map((res: HttpResponse<RestTasks[]>) => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  markPriseEnCharge(id: number): Observable<EntityResponseType> {
    return this.http
      .patch<RestTasks>(`${this.resourceUrl}/${id}/prise-en-charge`, null, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  deleteTaskFromCorrespAndDB(correspId: number, tasksId: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/deleteTaskFromCorrespAndDB/${correspId}/${tasksId}`, { observe: 'response' });
  }

  getTasksIdentifier(tasks: Pick<ITasks, 'id'>): number {
    return tasks.id;
  }

  compareTasks(o1: Pick<ITasks, 'id'> | null, o2: Pick<ITasks, 'id'> | null): boolean {
    return o1 && o2 ? this.getTasksIdentifier(o1) === this.getTasksIdentifier(o2) : o1 === o2;
  }

  // retourne HttpResponse<Blob> pour lire headers (filename) + body (blob)
  downloadTasksExcelByUserAcl(userId: string, status?: string): Observable<HttpResponse<Blob>> {
    const params = createRequestOption({ userId, status });
    // note: cast pour satisfaire TS quand responseType: 'blob'
    return this.http.get(`${this.resourceUrl}/tasksByUserAcl/export`, {
      params,
      responseType: 'blob',
      observe: 'response',
    }) as Observable<HttpResponse<Blob>>;
  }

  // ------------------------
  // Vérifier par ID (GET)
  // ------------------------
  canCurrentUserModifyTask(id: number): Observable<boolean> {
    if (id === null || id === undefined) {
      return of(false);
    }
    return this.http.get<boolean>(`${this.resourceUrl}/${id}/can-modify`).pipe(
      // si le backend renvoie autre chose ou erreur -> false
      catchError(() => of(false))
    );
  }

  // ------------------------
  // Vérifier en envoyant le DTO (POST) - si tu as implémenté l'endpoint POST
  // ------------------------
  canCurrentUserModifyTaskByDto(tasks: ITasks): Observable<boolean> {
    if (!tasks) {
      return of(false);
    }
    const copy = this.convertDateFromClient(tasks as any); // convertit les dates si nécessaire
    return this.http.post<boolean>(`${this.resourceUrl}/can-modify`, copy).pipe(catchError(() => of(false)));
  }

  // ------------------------
  // Helper pour enrichir une liste de tasks avec canModify (utilité côté liste)
  // ------------------------
  /**
   * Renvoie un Observable qui émet la même liste de tasks, chaque objet enrichi par canModify:boolean
   * ATTENTION : effectue N requêtes GET /{id}/can-modify (une par tâche)
   */
  enrichTasksWithCanModify(tasks: ITasks[]): Observable<ITasks[]> {
    if (!tasks || tasks.length === 0) return of(tasks ?? []);
    const calls = tasks.map(t => this.canCurrentUserModifyTask(t.id).pipe(catchError(() => of(false))));
    return forkJoin(calls).pipe(
      map(results => {
        return tasks.map((t, i) => ({ ...t, canModify: results[i] }));
      })
    );
  }

  addTasksToCollectionIfMissing<Type extends Pick<ITasks, 'id'>>(
    tasksCollection: Type[],
    ...tasksToCheck: (Type | null | undefined)[]
  ): Type[] {
    const tasks: Type[] = tasksToCheck.filter(isPresent);
    if (tasks.length > 0) {
      const tasksCollectionIdentifiers = tasksCollection.map(tasksItem => this.getTasksIdentifier(tasksItem)!);
      const tasksToAdd = tasks.filter(tasksItem => {
        const tasksIdentifier = this.getTasksIdentifier(tasksItem);
        if (tasksCollectionIdentifiers.includes(tasksIdentifier)) {
          return false;
        }
        tasksCollectionIdentifiers.push(tasksIdentifier);
        return true;
      });
      return [...tasksToAdd, ...tasksCollection];
    }
    return tasksCollection;
  }

  protected convertDateFromClient<T extends ITasks | NewTasks | PartialUpdateTasks>(tasks: T): RestOf<T> {
    return {
      ...tasks,
      creationDate: tasks.creationDate?.toJSON() ?? null,
      startDate: tasks.startDate?.toJSON() ?? null,
      dueDate: tasks.dueDate?.toJSON() ?? null,
      closeDate: tasks.closeDate?.toJSON() ?? null,
      updatedDate: tasks.updatedDate?.toJSON() ?? null,
      datePriseEnCharge: tasks.datePriseEnCharge?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restTasks: RestTasks): ITasks {
    return {
      ...restTasks,
      creationDate: restTasks.creationDate ? dayjs(restTasks.creationDate) : undefined,
      startDate: restTasks.startDate ? dayjs(restTasks.startDate) : undefined,
      dueDate: restTasks.dueDate ? dayjs(restTasks.dueDate) : undefined,
      closeDate: restTasks.closeDate ? dayjs(restTasks.closeDate) : undefined,
      updatedDate: restTasks.updatedDate ? dayjs(restTasks.updatedDate) : undefined,
      datePriseEnCharge: restTasks.datePriseEnCharge ? dayjs(restTasks.datePriseEnCharge) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestTasks>): HttpResponse<ITasks> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestTasks[]>): HttpResponse<ITasks[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
