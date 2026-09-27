import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UploadComponent } from './upload.component';
import { AcademicService } from '../services/academic.service';
import { AuthService } from '../services/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { BillingService } from '../services/billing.service';
import { PsychometricService } from '../services/psychometric.service';
import { AiResponse } from '../models/ai-response.model';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let httpMock: HttpTestingController;
  let mockAcademicService: ReturnType<typeof vi.fn>;
  let mockGetHistory: ReturnType<typeof vi.fn>;
  let mockGetResult: ReturnType<typeof vi.fn>;
  let mockRecordUsage: ReturnType<typeof vi.fn>;
  let mockResetUsage: ReturnType<typeof vi.fn>;
  let mockGetUsage: ReturnType<typeof vi.fn>;

  const userId = 'user-1';
  const resultKey = `pathly_result_${userId}`;

  const mockResult: AiResponse = {
    aiResponseId: 'test-id',
    extractionAcademicRecordId: null,
    userFullName: 'Test User',
    grade: '12',
    summary: 'Test summary',
    overallScore: 75,
    academicPersonality: 'Test',
    personalityDescription: 'Test',
    feedBack: 'Test',
    userStrength: 'Strong',
    userWeaknesses: 'Weak',
    motivationalMessage: 'Go!',
    subjectResults: [],
    topFiveBestCareers: [],
    topFiveAlternativeCareer: [],
    topDemandingJobs: [],
    dyingCareers: [],
    employmentOutlookAfterGraduation: [],
    universitiesToConsider: null,
    bursariesAvailable: null,
    studyTips: 'Study',
    improvementRoadmap: 'Roadmap',
    skillsToLearn: [],
    fiveYearOutlook: 'Good',
    salaryRange: 'R500k',
    riskAssessment: 'Low',
    teacherRecommendation: 'Yes',
    parentSummary: 'Summary',
    subjectChangeSuggestions: [],
    timeStamp: '2024-01-01',
  };

  beforeEach(async () => {
    mockAcademicService = vi.fn();
    mockGetHistory = vi.fn(() => of({ items: [], apsTrend: [] }));
    mockGetResult = vi.fn(() => of(mockResult));
    mockRecordUsage = vi.fn();
    mockResetUsage = vi.fn();
    mockGetUsage = vi.fn(() => of({ planCode: 'free' }));

    const mockAuth = {
      currentUserId: () => userId,
      isLoggedIn: () => true,
      currentUser: () => ({ id: userId, email: 'test@example.com', token: 't', expiration: '', plan: 'free' }),
      plan: () => 'free',
      isPro: () => false,
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AcademicService,
          useValue: { analyzeResults: mockAcademicService, getHistory: mockGetHistory, getResult: mockGetResult, analyzeCombined: vi.fn() },
        },
        { provide: AuthService, useValue: mockAuth },
        { provide: PsychometricService, useValue: { getLatest: vi.fn(() => throwError(() => ({ status: 404 }))) } },
        { provide: SubscriptionService, useValue: { recordUsage: mockRecordUsage, resetUsage: mockResetUsage, isPro: () => false, plan: () => 'free', isLoggedIn: () => true } },
        { provide: BillingService, useValue: { getUsage: mockGetUsage } },
      ],
    }).compileComponents();

    sessionStorage.clear();
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with no result', () => {
    expect(component.result()).toBeNull();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('should clear result and reset state', () => {
    component.result.set(mockResult);
    component.fileName.set('test.pdf');
    component.error.set('test error');
    sessionStorage.setItem(resultKey, JSON.stringify(mockResult));

    component.clearResult();

    expect(component.result()).toBeNull();
    expect(component.fileName()).toBe('');
    expect(component.error()).toBe('');
    expect(sessionStorage.getItem(resultKey)).toBeNull();
  });

  it('should set error for file exceeding size limit', () => {
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

    component['processFile'](largeFile);

    expect(component.error()).toContain('File too large');
    expect(component.loading()).toBe(false);
    expect(mockAcademicService).not.toHaveBeenCalled();
  });

  it('should call analyzeResults and set result on successful submit', async () => {
    mockAcademicService.mockReturnValue(of(mockResult));

    component['submit']('base64data', 'application/pdf', 'test.pdf');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAcademicService).toHaveBeenCalled();
    expect(component.result()).toBe(mockResult);
    expect(component.loading()).toBe(false);
    expect(component.history()[0]?.aiResponseId).toBe('test-id');
    expect(sessionStorage.getItem(resultKey)).not.toBeNull();
  });

  it('should handle 402 error with upgrade message', async () => {
    const err: any = Object.assign(new Error('Payment required'), { status: 402, error: { message: 'No credits left' } });
    mockAcademicService.mockReturnValue(throwError(() => err));

    component['submit']('base64data', 'application/pdf', 'test.pdf');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(component.error()).toContain('No credits left');
    expect(component.error()).toContain('Visit the plans page to upgrade');
    expect(component.loading()).toBe(false);
  });

  it('should handle 413 error for large file', async () => {
    const err: any = Object.assign(new Error('Payload too large'), { status: 413 });
    mockAcademicService.mockReturnValue(throwError(() => err));

    component['submit']('base64data', 'application/pdf', 'test.pdf');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(component.error()).toContain('too large');
    expect(component.loading()).toBe(false);
  });

  it('should handle 429 rate limit error', async () => {
    const err: any = Object.assign(new Error('Rate limited'), { status: 429 });
    mockAcademicService.mockReturnValue(throwError(() => err));

    component['submit']('base64data', 'application/pdf', 'test.pdf');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(component.error()).toContain('busy');
    expect(component.loading()).toBe(false);
  });

  it('should handle 401 session expired error', async () => {
    const err: any = Object.assign(new Error('Unauthorized'), { status: 401 });
    mockAcademicService.mockReturnValue(throwError(() => err));

    component['submit']('base64data', 'application/pdf', 'test.pdf');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(component.error()).toContain('expired');
    expect(component.loading()).toBe(false);
  });

  it('should handle 0 status connection error', async () => {
    const err: any = Object.assign(new Error('Connection failed'), { status: 0 });
    mockAcademicService.mockReturnValue(throwError(() => err));

    component['submit']('base64data', 'application/pdf', 'test.pdf');

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(component.error()).toContain('connect');
    expect(component.loading()).toBe(false);
  });

  it('should match labels correctly', () => {
    expect(component.getMatchLabel(90)).toBe('Strong Match');
    expect(component.getMatchLabel(80)).toBe('Good Match');
    expect(component.getMatchLabel(65)).toBe('Worth Exploring');
    expect(component.getMatchLabel(30)).toBe('Alternative Pathway');
  });

  it('should toggle career expansion', () => {
    expect(component.expandedCareer()).toBeNull();
    component.toggleCareer(1);
    expect(component.expandedCareer()).toBe(1);
    component.toggleCareer(1);
    expect(component.expandedCareer()).toBeNull();
  });

  it('should restore this user\'s result from their per-account sessionStorage key', () => {
    sessionStorage.setItem(resultKey, JSON.stringify(mockResult));
    const fixture2 = TestBed.createComponent(UploadComponent);
    expect(fixture2.componentInstance.result()).toBeTruthy();
    expect(fixture2.componentInstance.result()?.aiResponseId).toBe('test-id');
  });

  it('should NOT restore another user\'s result from a different key', () => {
    sessionStorage.setItem('pathly_result_someone-else', JSON.stringify(mockResult));
    const fixture2 = TestBed.createComponent(UploadComponent);
    expect(fixture2.componentInstance.result()).toBeNull();
  });
});
