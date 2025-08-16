import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { TypedocumentDetailComponent } from './typedocument-detail.component';

describe('Typedocument Management Detail Component', () => {
  let comp: TypedocumentDetailComponent;
  let fixture: ComponentFixture<TypedocumentDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TypedocumentDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ typedocument: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(TypedocumentDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(TypedocumentDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load typedocument on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.typedocument).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
