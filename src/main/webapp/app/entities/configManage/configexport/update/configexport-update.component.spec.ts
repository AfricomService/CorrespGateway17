import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { ConfigexportFormService } from './configexport-form.service';
import { ConfigexportService } from '../service/configexport.service';
import { IConfigexport } from '../configexport.model';

import { ConfigexportUpdateComponent } from './configexport-update.component';

describe('Configexport Management Update Component', () => {
  let comp: ConfigexportUpdateComponent;
  let fixture: ComponentFixture<ConfigexportUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let configexportFormService: ConfigexportFormService;
  let configexportService: ConfigexportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [ConfigexportUpdateComponent],
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
      .overrideTemplate(ConfigexportUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ConfigexportUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    configexportFormService = TestBed.inject(ConfigexportFormService);
    configexportService = TestBed.inject(ConfigexportService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const configexport: IConfigexport = { id: 456 };

      activatedRoute.data = of({ configexport });
      comp.ngOnInit();

      expect(comp.configexport).toEqual(configexport);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConfigexport>>();
      const configexport = { id: 123 };
      jest.spyOn(configexportFormService, 'getConfigexport').mockReturnValue(configexport);
      jest.spyOn(configexportService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ configexport });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: configexport }));
      saveSubject.complete();

      // THEN
      expect(configexportFormService.getConfigexport).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(configexportService.update).toHaveBeenCalledWith(expect.objectContaining(configexport));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConfigexport>>();
      const configexport = { id: 123 };
      jest.spyOn(configexportFormService, 'getConfigexport').mockReturnValue({ id: null });
      jest.spyOn(configexportService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ configexport: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: configexport }));
      saveSubject.complete();

      // THEN
      expect(configexportFormService.getConfigexport).toHaveBeenCalled();
      expect(configexportService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConfigexport>>();
      const configexport = { id: 123 };
      jest.spyOn(configexportService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ configexport });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(configexportService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
