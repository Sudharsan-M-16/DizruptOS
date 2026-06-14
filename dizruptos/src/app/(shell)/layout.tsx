import { CommandPalette } from "@/components/shell/command-palette";
import { GuardrailModal } from "@/components/shell/guardrail-modal";
import { TaskDrawer } from "@/components/shell/task-drawer";
import { ShortcutManager } from "@/components/shell/shortcuts";
import { AuthGate } from "@/components/shell/auth-gate";
import { ShellFrame } from "@/components/shell/shell-frame";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <ShellFrame>{children}</ShellFrame>
      <CommandPalette />
      <GuardrailModal />
      <TaskDrawer />
      <ShortcutManager />
    </AuthGate>
  );
}
