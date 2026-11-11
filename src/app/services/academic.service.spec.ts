import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AcademicService, apsPointsForMark, calculateApsFromMarks } from './academic.service';

describe('APS calculation from NSC marks', () => {
  it.each([
    [100, 7],
    [80, 7],
    [79, 6],
    [70, 6],
    [69, 5],
    [60, 5],
    [59, 4],
    [50, 4],
    [49, 3],
    [40, 3],
    [39, 2],
    [30, 2],
    [29, 1],
    [0, 1],
  ])('converts %i%% into %i APS point(s)', (mark, points) => {
    expect(apsPointsForMark(mark)).toBe(points);
  });

  it('sums points from each subject mark consistently', () => {
    expect(calculateApsFromMarks([80, 50, 100, 33])).toBe(20);
  });

  it('uses exact subject marks instead of an inconsistent API total or grade', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const service = TestBed.inject(AcademicService);
    const result = (service as any).mapResponse({
      subjectResults: [
        { subject: 'Mathematics', mark: 80, grade: 'Level 5', apsPoints: 7, includedInApsCalculation: true },
        { subject: 'Information Technology', mark: 50, grade: 'Level 4', apsPoints: 4, includedInApsCalculation: true },
        { subject: 'English', mark: 100, grade: 'Level 7', apsPoints: 7, includedInApsCalculation: true },
        { subject: 'Accounting', mark: 33, grade: 'Level 3', apsPoints: 2, includedInApsCalculation: true },
        { subject: 'Life Orientation', mark: 90, grade: 'Level 7', apsPoints: 7, includedInApsCalculation: false },
      ],
      apsAnalysis: { calculatedAPS: 19, universitiesTheyQualifyFor: [], universitiesTheyDoNotQualifyFor: [] },
    });

    expect(result.apsAnalysis.calculatedAPS).toBe(20);
    expect(result.subjectResults.map((subject: { grade: string }) => subject.grade))
      .toEqual(['Level 7', 'Level 4', 'Level 7', 'Level 2', 'Level 7']);
  });
});
