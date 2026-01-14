import { getCustomer } from '../../src/client/get.client';
import { extractCustomerWithEntityUseCode } from '../../src/service/entity.use.code.service';
import { CustomerWithEntityUseCode } from '../../src/service/types';
import { describe, expect, jest, it, afterEach } from '@jest/globals';

jest.mock('../../src/client/get.client');

const mockGetCustomer = getCustomer as jest.MockedFunction<typeof getCustomer>;

describe('extractCustomerWithEntityUseCode', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return guest customer number if customerId is undefined', async () => {
    const result = await extractCustomerWithEntityUseCode(undefined);
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

    const result = await extractCustomerWithEntityUseCode(customerId);
    expect(mockGetCustomer).toHaveBeenCalledWith(customerId);
    expect(result).toEqual({
      customerNumber: '12345',
      exemptCode: 'exempt-code',
    } as CustomerWithEntityUseCode);
  });

  it('should return customerId as customer number if customer is not found', async () => {
    const customerId = 'customer-id';
    mockGetCustomer.mockResolvedValue(undefined);

    const result = await extractCustomerWithEntityUseCode(customerId);
    expect(mockGetCustomer).toHaveBeenCalledWith(customerId);
    expect(result).toEqual({
      customerNumber: customerId,
      exemptCode: undefined,
    } as CustomerWithEntityUseCode);
  });
});
