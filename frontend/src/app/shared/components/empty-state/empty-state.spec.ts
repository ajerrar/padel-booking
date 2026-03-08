import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyStateComponents } from './empty-state.components';

describe('EmptyStateComponents', () => {
  let component: EmptyStateComponents;
  let fixture: ComponentFixture<EmptyStateComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
