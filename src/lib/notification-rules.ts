export function inQuietHours(date:Date,timezone:string,start:string|null,end:string|null) {
  if(!start || !end || start===end)return false;
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const time=`${parts.find(p=>p.type==='hour')?.value}:${parts.find(p=>p.type==='minute')?.value}`;
  return start<end ? time>=start&&time<end : time>=start||time<end;
}
export function effectiveDailyLimit(prime:boolean,limit:number|null) { return prime?limit:Math.min(limit??3,3); }