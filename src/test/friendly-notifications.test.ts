import { describe,expect,it } from 'vitest';
import { permissionThanks } from '@/lib/friendly-notifications';
describe('Notification permission',()=>{
  it('does not acknowledge permission when it was refused',()=>{expect(permissionThanks(false)).toBeNull();expect(permissionThanks(true)).not.toBeNull();});
});