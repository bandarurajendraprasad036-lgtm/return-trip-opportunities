export function mayManageAccount(actorIsAdmin: boolean, actorId: string, targetId: string, targetIsAdmin: boolean) {
  return actorIsAdmin && actorId !== targetId && !targetIsAdmin;
}