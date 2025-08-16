import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { NoteDetailComponent } from './note-detail.component';

describe('Note Management Detail Component', () => {
  let comp: NoteDetailComponent;
  let fixture: ComponentFixture<NoteDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NoteDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ note: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(NoteDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(NoteDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load note on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.note).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
