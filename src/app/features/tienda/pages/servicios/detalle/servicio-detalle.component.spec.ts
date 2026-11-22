import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ServicioDetalleComponent } from './servicio-detalle.component';
import { PublicServicesApiService } from '../../../services/public-services-api.service';

describe('ServicioDetalleComponent', () => {
  let api: jasmine.SpyObj<PublicServicesApiService>;

  async function setup(id='11111111-1111-4111-8111-111111111111') {
    await TestBed.configureTestingModule({
      imports: [ServicioDetalleComponent],
      providers: [
        provideRouter([]),
        { provide: PublicServicesApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(ServicioDetalleComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => { api = jasmine.createSpyObj<PublicServicesApiService>('PublicServicesApiService', ['getById']); });

  it('loads active service with optional null fields', async () => {
    api.getById.and.returnValue(of({ id:'1', name:'Svc', slug:'svc', description:null, price_cop:'1000', duration_minutes:null, image_url:null, is_active:true, created_at:'', updated_at:'' } as any));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Svc');
    expect(fixture.componentInstance.notFound()).toBeFalse();
  });

  it('marks inactive service as not available', async () => {
    api.getById.and.returnValue(of({ id:'1', name:'Svc', slug:'svc', description:'d', price_cop:'1000', duration_minutes:10, image_url:null, is_active:false, created_at:'', updated_at:'' } as any));
    const fixture = await setup();
    expect(fixture.componentInstance.notFound()).toBeTrue();
  });

  it('handles 404 as not found', async () => {
    api.getById.and.returnValue(throwError(() => ({ status: 404, message: 'not found' })));
    const fixture = await setup();
    expect(fixture.componentInstance.notFound()).toBeTrue();
  });
});
