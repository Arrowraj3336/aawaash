import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { friendlyError } from "@/lib/error-messages";

export type StructureField = {
  name: string;
  label: string;
  type?: "number" | "text" | "password";
  initial?: string | number | null;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  options?: { value: string; label: string }[];
};

export type StructureEditor = {
  title: string;
  description: string;
  fields: StructureField[];
  save: (values: Record<string, string>) => Promise<unknown>;
};

export function StructureForm({ editor, onClose, onSaved }: {
  editor: StructureEditor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setSaving(true);
    setError("");
    try {
      await editor.save(data);
      onSaved();
    } catch (cause) {
      setError(friendlyError(cause, "The changes could not be saved."));
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <DialogContent className="inventory-sheet max-h-[88dvh] overflow-y-auto rounded-3xl">
        <DialogTitle>{editor.title}</DialogTitle>
        <DialogDescription>{editor.description}</DialogDescription>
        <form className="space-y-4" onSubmit={submit}>
          {editor.fields.map(field => (
            <label className="grid gap-1.5 text-sm font-semibold" key={field.name}>
              {field.label}
              {field.options ? (
                <select name={field.name} defaultValue={field.initial ?? ""} className="min-h-12 rounded-xl border border-input bg-surface px-3 text-base font-normal">
                  {field.options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
              ) : <input name={field.name} type={field.type ?? "text"} defaultValue={field.initial ?? ""} autoComplete={field.type === "password" ? "new-password" : undefined}
                required={field.required} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength}
                className="min-h-12 rounded-xl border border-input bg-surface px-3 text-base font-normal text-foreground focus-visible:outline-2 focus-visible:outline-primary" />}
            </label>
          ))}
          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={onClose} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
