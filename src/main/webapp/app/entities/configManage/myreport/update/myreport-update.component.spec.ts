import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { MyreportFormService } from './myreport-form.service';
import { MyreportService } from '../service/myreport.service';
import { IMyreport } from '../myreport.model';
import { IConfigexport } from 'app/entities/configManage/configexport/configexport.model';
import { ConfigexportService } from 'app/entities/configManage/configexport/service/configexport.service';

import { MyreportUpdateComponent } from './myreport-update.component';

describe('Myreport Management Update Component', () => {
  let comp: MyreportUpdateComponent;
  let fixture: ComponentFixture<MyreportUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let myreportFormService: MyreportFormService;
  let myreportService: MyreportService;
  let configexportService: ConfigexportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [MyreportUpdateComponent],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(MyreportUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(MyreportUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    myreportFormService = TestBed.inject(MyreportFormService);
    myreportService = TestBed.inject(MyreportService);
    configexportService = TestBed.inject(ConfigexportService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Configexport query and add missing value', () => {
      const myreport: IMyreport = { id: 456 };
      const configexport: IConfigexport = { id: 65169 };
      myreport.configexport = configexport;

      const configexportCollection: IConfigexport[] = [{ id: 1741 }];
      jest.spyOn(configexportService, 'query').mockReturnValue(of(new HttpResponse({ body: configexportCollection })));
      const additionalConfigexports = [configexport];
      const expectedCollection: IConfigexport[] = [...additionalConfigexports, ...configexportCollection];
      jest.spyOn(configexportService, 'addConfigexportToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ myreport });
      comp.ngOnInit();

      expect(configexportService.query).toHaveBeenCalled();
      expect(configexportService.addConfigexportToCollectionIfMissing).toHaveBeenCalledWith(
        configexportCollection,
        ...additionalConfigexports.map(expect.objectContaining)
      );
      expect(comp.configexportsSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const myreport: IMyreport = { id: 456 };
      const configexport: IConfigexport = { id: 19587 };
      myreport.configexport = configexport;

      activatedRoute.data = of({ myreport });
      comp.ngOnInit();

      expect(comp.configexportsSharedCollection).toContain(configexport);
      expect(comp.myreport).toEqual(myreport);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IMyreport>>();
      const myreport = { id: 123 };
      jest.spyOn(myreportFormService, 'getMyreport').mockReturnValue(myreport);
      jest.spyOn(myreportService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ myreport });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: myreport }));
      saveSubject.complete();

      // THEN
      expect(myreportFormService.getMyreport).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(myreportService.update).toHaveBeenCalledWith(expect.objectContaining(myreport));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IMyreport>>();
      const myreport = { id: 123 };
      jest.spyOn(myreportFormService, 'getMyreport').mockReturnValue({ id: null });
      jest.spyOn(myreportService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ myreport: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: myreport }));
      saveSubject.complete();

      // THEN
      expect(myreportFormService.getMyreport).toHaveBeenCalled();
      expect(myreportService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IMyreport>>();
      const myreport = { id: 123 };
      jest.spyOn(myreportService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ myreport });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(myreportService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareConfigexport', () => {
      it('Should forward to configexportService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(configexportService, 'compareConfigexport');
        comp.compareConfigexport(entity, entity2);
        expect(configexportService.compareConfigexport).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
