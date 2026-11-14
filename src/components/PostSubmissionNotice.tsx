import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

export function PostSubmissionNotice({ postId }: { postId: string }) {
  const navigate = useNavigate();
  return <section className="space-y-4 p-4" aria-live="polite" data-post-id={postId}><p className="break-words text-lg font-bold leading-relaxed">మీ పోస్ట్ ఉచితంగా భద్రపడింది.</p><Button className="h-auto min-h-14 w-full whitespace-normal" onClick={() => void navigate({ to: '/my-posts' })}>నా పోస్టులు</Button><Button variant="outline" className="h-auto min-h-14 w-full whitespace-normal" onClick={() => void navigate({ to: '/' })}>ముందు పేజీకి వెళ్ళండి</Button></section>;
}