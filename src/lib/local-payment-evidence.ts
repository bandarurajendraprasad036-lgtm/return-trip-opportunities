export type LocalPaymentEvidence = {
  ownerId: string;
  beneficiary: string;
  reference: string;
  amount: number;
  photo: string;
  photoName: string;
  savedAt: string;
  status: 'local-only';
};

export function localPaymentKey(ownerId: string, reference: string) {
  return `gayatri-local-payment:${ownerId}:${reference}`;
}

function photoData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('PHOTO_READ_FAILED'));
    reader.onerror = () => reject(new Error('PHOTO_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

function saveLargeEvidence(key: string, evidence: LocalPaymentEvidence): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gayatri-local-payments', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('evidence');
    request.onerror = () => reject(new Error('LOCAL_SAVE_FAILED'));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('evidence', 'readwrite');
      transaction.objectStore('evidence').put(evidence, key);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onabort = () => { db.close(); reject(new Error('LOCAL_SAVE_FAILED')); };
      transaction.onerror = () => { db.close(); reject(new Error('LOCAL_SAVE_FAILED')); };
    };
  });
}

export async function saveLocalPaymentEvidence(input: {
  ownerId: string; reference: string; image: File; amount: number; beneficiary?: string | undefined;
}, storage: Pick<Storage, 'setItem'> = localStorage, fallback = saveLargeEvidence) {
  if (!input.ownerId || !/^\d{12}$/.test(input.reference) || input.image.size === 0) throw new Error('INVALID_LOCAL_EVIDENCE');
  const evidence: LocalPaymentEvidence = {
    ownerId: input.ownerId, beneficiary: input.beneficiary ?? input.ownerId,
    reference: input.reference, amount: input.amount,
    photo: await photoData(input.image), photoName: input.image.name,
    savedAt: new Date().toISOString(), status: 'local-only',
  };
  const key = localPaymentKey(input.ownerId, input.reference);
  try { storage.setItem(key, JSON.stringify(evidence)); }
  catch { await fallback(key, evidence); }
  window.dispatchEvent(new Event('gayatri-local-payment-saved'));
  return evidence;
}

export async function hasLocalPaymentEvidence(ownerId: string, storage: Pick<Storage, 'length' | 'key' | 'getItem'> = localStorage): Promise<boolean> {
  const matches = (row: Partial<LocalPaymentEvidence>) => row.ownerId === ownerId && row.beneficiary === ownerId && row.status === 'local-only' && /^\d{12}$/.test(row.reference ?? '') && !!row.photo;
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(`gayatri-local-payment:${ownerId}:`)) continue;
    try { if (matches(JSON.parse(storage.getItem(key) ?? '{}'))) return true; } catch { /* Ignore incomplete local records. */ }
  }
  if (typeof indexedDB === 'undefined') return false;
  return new Promise(resolve => {
    const request = indexedDB.open('gayatri-local-payments', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('evidence');
    request.onerror = () => resolve(false);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('evidence', 'readonly').objectStore('evidence').getAll();
      read.onsuccess = () => { resolve((read.result as LocalPaymentEvidence[]).some(matches)); db.close(); };
      read.onerror = () => { resolve(false); db.close(); };
    };
  });
}