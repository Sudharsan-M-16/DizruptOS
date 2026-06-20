// Minimal layout for onboarding — no shell, no menubar, no desktop chrome.

export const metadata = {
  title: "Setup — DIZRUPT",
  description: "Set up your DIZRUPT workspace",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#040C12", color: "white" }}>
      {children}
    </div>
  );
}
