import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ITasks, NewTasks } from '../tasks.model';

export type PartialUpdateTasks = Partial<ITasks> & Pick<ITasks, 'id'>;

type RestOf<T extends ITasks | NewTasks> = Omit<T, 'creationDate' | 'startDate' | 'dueDate' | 'closeDate' | 'updatedDate'> & {
  creationDate?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  closeDate?: string | null;
  updatedDate?: string | null;
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

  getTasksByUserAcl(userId: number, status?: string): Observable<EntityArrayResponseType> {
    const params = createRequestOption({ userId, status });
    return this.http
      .get<RestTasks[]>(`${this.resourceUrl}/tasksByUserAcl`, { params, observe: 'response' })
      .pipe(map((res: HttpResponse<RestTasks[]>) => this.convertResponseArrayFromServer(res)));
  }

  getAllTasksByUserAclAllStatuses(userId: number): Observable<EntityArrayResponseType> {
    const options = createRequestOption({ userId });
    return this.http
      .get<RestTasks[]>(`${this.resourceUrl}/tasksByUserAclAllStatuses`, { params: options, observe: 'response' })
      .pipe(map((res: HttpResponse<RestTasks[]>) => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
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
