import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCrud } from './service-crud';

describe('ServiceCrud', () => {
  let component: ServiceCrud;
  let fixture: ComponentFixture<ServiceCrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
