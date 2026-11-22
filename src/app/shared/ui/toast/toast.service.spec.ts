import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => { TestBed.configureTestingModule({}); });

  it('adds and dismisses toasts', () => {
    const service = TestBed.inject(ToastService);
    const id = service.success('ok');
    expect(service.toasts().length).toBe(1);
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('auto-closes toast when duration is set', (done) => {
    const service = TestBed.inject(ToastService);
    service.show({ message: 'temp', duration: 10, variant: 'info' });
    setTimeout(() => { expect(service.toasts().length).toBe(0); done(); }, 30);
  });
});
