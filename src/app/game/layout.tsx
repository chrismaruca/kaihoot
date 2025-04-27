export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div >
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
