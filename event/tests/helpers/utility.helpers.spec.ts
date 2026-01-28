import { describe, expect, jest, it, afterEach } from '@jest/globals';
import { getYearAgoDate } from '../../src/avalara/helpers/utility.helpers';

describe('utility.helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('getYearAgoDate', () => {
    it('should return the date string representing the date one year ago from today in en-CA format', () => {
      // Mock the current date to a fixed point in time
      const mockDate = new Date('2024-06-15T00:00:00Z');
      jest
        .spyOn(global, 'Date')
        .mockImplementation(() => mockDate as unknown as Date);

      const result = getYearAgoDate();

      expect(result).toBe('2023-06-15');
    });
  });
});
