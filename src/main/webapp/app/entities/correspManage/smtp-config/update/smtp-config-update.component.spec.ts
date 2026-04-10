import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { SmtpConfigFormService } from './smtp-config-form.service';
import { SmtpConfigService } from '../service/smtp-config.service';
import { ISmtpConfig } from '../smtp-config.model';

import { SmtpConfigUpdateComponent } from './smtp-config-update.component';

describe('SmtpConfig Management Update Component', () => {
  let comp: SmtpConfigUpdateComponent;
  let fixture: ComponentFixture<SmtpConfigUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let smtpConfigFormService: SmtpConfigFormService;
  let smtpConfigService: SmtpConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [SmtpConfigUpdateComponent],
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
      .overrideTemplate(SmtpConfigUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(SmtpConfigUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    smtpConfigFormService = TestBed.inject(SmtpConfigFormService);
    smtpConfigService = TestBed.inject(SmtpConfigService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const smtpConfig: ISmtpConfig = { id: 456 };

      activatedRoute.data = of({ smtpConfig });
      comp.ngOnInit();

      expect(comp.smtpConfig).toEqual(smtpConfig);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ISmtpConfig>>();
      const smtpConfig = { id: 123 };
      jest.spyOn(smtpConfigFormService, 'getSmtpConfig').mockReturnValue(smtpConfig);
      jest.spyOn(smtpConfigService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ smtpConfig });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: smtpConfig }));
      saveSubject.complete();

      // THEN
      expect(smtpConfigFormService.getSmtpConfig).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(smtpConfigService.update).toHaveBeenCalledWith(expect.objectContaining(smtpConfig));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ISmtpConfig>>();
      const smtpConfig = { id: 123 };
      jest.spyOn(smtpConfigFormService, 'getSmtpConfig').mockReturnValue({ id: null });
      jest.spyOn(smtpConfigService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ smtpConfig: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: smtpConfig }));
      saveSubject.complete();

      // THEN
      expect(smtpConfigFormService.getSmtpConfig).toHaveBeenCalled();
      expect(smtpConfigService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ISmtpConfig>>();
      const smtpConfig = { id: 123 };
      jest.spyOn(smtpConfigService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ smtpConfig });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(smtpConfigService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
