export const EVIDENCE_RETENTION_HOURS=24;
export const evidenceImageCount=(purpose:'early_publication'|'notifications')=>purpose==='early_publication'?5:10;
export const evidenceReadable=(admin:boolean,expiresAt:string,now=new Date())=>admin&&Date.parse(expiresAt)>now.getTime();
export const validDecisionReason=(approved:boolean,reason:string)=>approved||reason.trim().length>=2;
export const distinctEvidence=(hashes:string[])=>hashes.every(h=>/^[a-f0-9]{64}$/.test(h))&&new Set(hashes).size===hashes.length;