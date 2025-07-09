export default async function ImpersonatePage({ params }: any) {
  const { id } = (await params) as { id: string };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Impersonate Tenant</h1>
      <p>You are now impersonating tenant {id}.</p>
    </div>
  );
}
