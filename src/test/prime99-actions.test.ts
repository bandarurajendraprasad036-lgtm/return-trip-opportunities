import { describe, expect, it } from 'vitest';
import { unfinishedHomeActions } from '@/lib/prime99';
describe('independent home action completion', () => {
  it('main bell completion stops only the bell reminder', () => {
    expect(unfinishedHomeActions(true,false,false)).toEqual({bell:false,install:true,profile:true});
  });
  it('completed profile stops its reminder without an installation claim', () => {
    expect(unfinishedHomeActions(false,false,true)).toEqual({bell:true,install:true,profile:false});
  });
  it('confirmed installation stops only the installation reminder', () => {
    expect(unfinishedHomeActions(false,true,false)).toEqual({bell:true,install:false,profile:true});
  });
});