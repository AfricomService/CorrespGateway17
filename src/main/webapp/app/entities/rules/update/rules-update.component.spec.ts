import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { RulesFormService } from './rules-form.service';
import { RulesService } from '../service/rules.service';
import { IRules } from '../rules.model';

import { RulesUpdateComponent } from './rules-update.component';

describe('Rules Management Update Component', () => {
  let comp: RulesUpdateComponent;
  let fixture: ComponentFixture<RulesUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let rulesFormService: RulesFormService;
  let rulesService: RulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [RulesUpdateComponent],
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
      .overrideTemplate(RulesUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(RulesUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    rulesFormService = TestBed.inject(RulesFormService);
    rulesService = TestBed.inject(RulesService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const rules: IRules = { id: 456 };

      activatedRoute.data = of({ rules });
      comp.ngOnInit();

      expect(comp.rules).toEqual(rules);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IRules>>();
      const rules = { id: 123 };
      jest.spyOn(rulesFormService, 'getRules').mockReturnValue(rules);
      jest.spyOn(rulesService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ rules });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: rules }));
      saveSubject.complete();

      // THEN
      expect(rulesFormService.getRules).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(rulesService.update).toHaveBeenCalledWith(expect.objectContaining(rules));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IRules>>();
      const rules = { id: 123 };
      jest.spyOn(rulesFormService, 'getRules').mockReturnValue({ id: null });
      jest.spyOn(rulesService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ rules: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: rules }));
      saveSubject.complete();

      // THEN
      expect(rulesFormService.getRules).toHaveBeenCalled();
      expect(rulesService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IRules>>();
      const rules = { id: 123 };
      jest.spyOn(rulesService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ rules });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(rulesService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
