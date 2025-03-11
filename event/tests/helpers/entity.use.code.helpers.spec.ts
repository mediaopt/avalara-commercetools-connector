import { getCustomer } from '../../src/client/data.client';
import { extractEntityUseCode } from '../../src/avalara/helpers/entity.use.code.helpers';
import { CustomerWithEntityUseCode } from '../../src/avalara/types/index.types';
import { describe, expect, jest, it, afterEach } from '@jest/globals';

jest.mock('../../src/client/data.client');

const mockGetCustomer = getCustomer as jest.MockedFunction<typeof getCustomer>;

describe('extractEntityUseCode', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return guest customer number if customerId is undefined', async () => {
    const result = await extractEntityUseCode(undefined);
    expect(result).toEqual({
      customerNumber: 'Guest',
    } as CustomerWithEntityUseCode);
  });

  it('should return customer number and exempt code if customer is found', async () => {
    const customerId = 'customer-id';
    const mockCustomer = {
      customerNumber: '12345',
      custom: {
        fields: {
          avalaraEntityUseCode: 'exempt-code',
        },
      },
    };
    mockGetCustomer.mockResolvedValue(mockCustomer as any);

    const result = await extractEntityUseCode(customerId);
    expect(mockGetCustomer).toHaveBeenCalledWith(customerId);
    expect(result).toEqual({
      customerNumber: '12345',
      exemptCode: 'exempt-code',
    } as CustomerWithEntityUseCode);
  });

  it('should return customerId as customer number if customer is not found', async () => {
    const customerId = 'customer-id';
    mockGetCustomer.mockResolvedValue(undefined);

    const result = await extractEntityUseCode(customerId);
    expect(mockGetCustomer).toHaveBeenCalledWith(customerId);
    expect(result).toEqual({
      customerNumber: customerId,
      exemptCode: undefined,
    } as CustomerWithEntityUseCode);
  });
});
