import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSiteMembers } from './admin-site-members';

describe('AdminSiteMembers', () => {
  let component: AdminSiteMembers;
  let fixture: ComponentFixture<AdminSiteMembers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSiteMembers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSiteMembers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
