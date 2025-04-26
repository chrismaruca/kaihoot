export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
