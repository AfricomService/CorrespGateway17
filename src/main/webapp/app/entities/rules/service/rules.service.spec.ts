import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IRules } from '../rules.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../rules.test-samples';

import { RulesService } from './rules.service';

const requireRestSample: IRules = {
  ...sampleWithRequiredData,
};

describe('Rules Service', () => {
  let service: RulesService;
  let httpMock: HttpTestingController;
  let expectedResult: IRules | IRules[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    expectedResult = null;
    service = TestBed.inject(RulesService);
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

    it('should create a Rules', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const rules = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(rules).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Rules', () => {
      const rules = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(rules).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Rules', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Rules', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Rules', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addRulesToCollectionIfMissing', () => {
      it('should add a Rules to an empty array', () => {
        const rules: IRules = sampleWithRequiredData;
        expectedResult = service.addRulesToCollectionIfMissing([], rules);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(rules);
      });

      it('should not add a Rules to an array that contains it', () => {
        const rules: IRules = sampleWithRequiredData;
        const rulesCollection: IRules[] = [
          {
            ...rules,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addRulesToCollectionIfMissing(rulesCollection, rules);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Rules to an array that doesn't contain it", () => {
        const rules: IRules = sampleWithRequiredData;
        const rulesCollection: IRules[] = [sampleWithPartialData];
        expectedResult = service.addRulesToCollectionIfMissing(rulesCollection, rules);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(rules);
      });

      it('should add only unique Rules to an array', () => {
        const rulesArray: IRules[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const rulesCollection: IRules[] = [sampleWithRequiredData];
        expectedResult = service.addRulesToCollectionIfMissing(rulesCollection, ...rulesArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const rules: IRules = sampleWithRequiredData;
        const rules2: IRules = sampleWithPartialData;
        expectedResult = service.addRulesToCollectionIfMissing([], rules, rules2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(rules);
        expect(expectedResult).toContain(rules2);
      });

      it('should accept null and undefined values', () => {
        const rules: IRules = sampleWithRequiredData;
        expectedResult = service.addRulesToCollectionIfMissing([], null, rules, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(rules);
      });

      it('should return initial array if no Rules is added', () => {
        const rulesCollection: IRules[] = [sampleWithRequiredData];
        expectedResult = service.addRulesToCollectionIfMissing(rulesCollection, undefined, null);
        expect(expectedResult).toEqual(rulesCollection);
      });
    });

    describe('compareRules', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareRules(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: 123 };
        const entity2 = null;

        const compareResult1 = service.compareRules(entity1, entity2);
        const compareResult2 = service.compareRules(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 456 };

        const compareResult1 = service.compareRules(entity1, entity2);
        const compareResult2 = service.compareRules(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: 123 };
        const entity2 = { id: 123 };

        const compareResult1 = service.compareRules(entity1, entity2);
        const compareResult2 = service.compareRules(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
