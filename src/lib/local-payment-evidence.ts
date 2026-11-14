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
  return evidence;
}