import Link from "next/link";
import NewClientForm from "./NewClientForm";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-ink-500 hover:text-ink-700">
          ← Back to businesses
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Add a new business</h1>
        <p className="text-sm text-ink-500">
          Once it&apos;s created you can edit the widget, build the intake flow, and grab the
          install script.
        </p>
      </div>
      <NewClientForm />
    </div>
  );
}
