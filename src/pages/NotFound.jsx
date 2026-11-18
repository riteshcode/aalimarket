import { MapPinOff } from 'lucide-react';
import { EmptyState } from '../components/States';

export default function NotFound() {
  return (
    <div className="page container">
      <EmptyState icon={MapPinOff} title="This page doesn’t exist" text="The link may be old or mistyped." action="Go to home" to="/" />
    </div>
  );
}
