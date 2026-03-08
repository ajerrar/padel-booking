import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotList } from './slot-list';

describe('SlotList', () => {
  let component: SlotList;
  let fixture: ComponentFixture<SlotList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
