import { expect, it } from 'vitest';
import { rotateServicePriority } from '@/lib/service-priority';
it('rotates subscribed services without putting unpaid providers ahead of them', () => {
  const rows = [{ id:'free',priority:0 },{id:'first',priority:1},{id:'second',priority:2}];
  expect(rotateServicePriority(rows,1).map(row=>row.id)).toEqual(['second','first','free']);
  expect(rotateServicePriority([],5)).toEqual([]);
});