import { Link } from 'react-router';

export function LoginPrompt() {
  return (
    <div className="flex items-center justify-center py-20 text-text-secondary">
      请先
      <Link to="/auth" className="text-primary underline">
        登录
      </Link>
    </div>
  );
}
