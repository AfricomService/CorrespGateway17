import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ITasks } from '../tasks.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../tasks.test-samples';

import { TasksService, RestTasks } from './tasks.service';

const requireRestSample: RestTasks = {
  ...sampleWithRequiredData,
  creationDate: sampleWithRequiredData.creationDate?.toJSON(),
  startDate: sampleWithRequiredData.startDate?.toJSON(),
  dueDate: sampleWithRequiredData.dueDate?.toJSON(),
  closeDate: sampleWithRequiredData.closeDate?.toJSON(),
  updatedDate: sampleWithRequiredData.updatedDate?.toJSON(),
};

describe('Tasks Service', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;
  let expectedResult: ITasks | ITasks[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find(123).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Tasks', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const tasks = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(tasks).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Tasks', () => {
      const tasks = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(tasks).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Tasks', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Tasks', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Tasks', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addTasksToCollectionIfMissing', () => {
      it('should add a Tasks to an empty array', () => {
        const tasks: ITasks = sampleWithRequiredData;
        expectedResult = service.addTasksToCollectionIfMissing([], tasks);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(tasks);
      });

      it('should not add a Tasks to an array that contains it', () => {
        const tasks: ITasks = sampleWithRequiredData;
        const tasksCollection: ITasks[] = [
          {
            ...tasks,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addTasksToCollectionIfMissing(tasksCollection, tasks);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Tasks to an array that doesn't contain it", () => {
        const tasks: ITasks = sampleWithRequiredData;
        const tasksCollection: ITasks[] = [sampleWithPartialData];
        expectedResult = service.addTasksToCollectionIfMissing(tasksCollection, tasks);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(tasks);
      });

      it('should add only unique Tasks to an array', () => {
        const tasksArray: ITasks[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const tasksCollection: ITasks[] = [sampleWithRequiredData];
        expectedResult = service.addTasksToCollectionIfMissing(tasksCollection, ...tasksArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const tasks: ITasks = sampleWithRequiredData;
        const tasks2: ITasks = sampleWithPartialData;
        expectedResult = service.addTasksToCollectionIfMissing([], tasks, tasks2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(tasks);
        expect(expectedResult).toContain(tasks2);
      });

      it('should accept null and undefined values', () => {
        const tasks: ITasks = sampleWithRequiredData;
        expectedResult = service.addTasksToCollectionIfMissing([], null, tasks, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(tasks);
      });

      it('should return initial array if no Tasks is added', () => {
        const tasksCollection: ITasks[] = [sampleWithRequiredData];
        expectedResult = service.addTasksToCollectionIfMissing(tasksCollection, undefined, null);
        expect(expectedResult).toEqual(tasksCollection);
      });
    });

    describe('compareTasks', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareTasks(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareTasks(entity1, entity2);
        const compareResult2 = service.compareTasks(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareTasks(entity1, entity2);
        const compareResult2 = service.compareTasks(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareTasks(entity1, entity2);
        const compareResult2 = service.compareTasks(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
