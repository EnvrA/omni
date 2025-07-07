export default function ImpersonatePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Impersonate Tenant</h1>
      <p>You are now impersonating tenant {params.id}.</p>
    </div>
  );
}
