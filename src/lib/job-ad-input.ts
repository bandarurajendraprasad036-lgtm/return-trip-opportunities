export function buildJobAdInput(input: { text: string; skills: string; experience: string; salary: string; location: string }): string {
  return [
    input.skills.trim() && `Skills / నైపుణ్యాలు: ${input.skills.trim()}`,
    input.experience.trim() && `Experience / అనుభవం: ${input.experience.trim()}`,
    input.salary.trim() && `Expected salary / ఆశించే జీతం: ${input.salary.trim()}`,
    input.location.trim() && `Location / ప్రాంతం: ${input.location.trim()}`,
    input.text.trim(),
  ].filter(Boolean).join("\n");
}