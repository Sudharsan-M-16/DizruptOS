import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { GuardrailModal } from "@/components/shell/guardrail-modal";
import { TaskDrawer } from "@/components/shell/task-drawer";
import { ShortcutManager } from "@/components/shell/shortcuts";
import { AuthGate } from "@/components/shell/auth-gate";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="relative z-10 min-h-screen">
        <Sidebar />
        <div className="pl-[256px]">
          <Topbar />
          <main className="mx-auto max-w-[1520px] px-6 py-7 lg:px-10 lg:py-9">{children}</main>
        </div>
        <CommandPalette />
        <GuardrailModal />
        <TaskDrawer />
        <ShortcutManager />
      </div>
    </AuthGate>
  );
}
