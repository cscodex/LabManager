import { ThemeToggle } from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-sm text-muted-foreground">Click to toggle dark/light mode</span>
      </div>
    </div>
  );
}