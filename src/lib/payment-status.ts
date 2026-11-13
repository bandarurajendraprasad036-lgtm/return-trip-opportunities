export function paymentPostingHeld(active: boolean, pending: boolean | undefined) {
  return !active && pending !== false;
}

export function hidePaymentEvidence(body: string, adminConversation: boolean, isAdmin: boolean) {
  return !isAdmin && adminConversation && /\b\d{12}\b/.test(body);
}