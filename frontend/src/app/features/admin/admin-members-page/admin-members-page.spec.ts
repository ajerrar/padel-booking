import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMembers } from './admin-members';

describe('AdminMembers', () => {
  let component: AdminMembers;
  let fixture: ComponentFixture<AdminMembers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMembers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMembers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
