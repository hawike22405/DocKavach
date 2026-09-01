"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { ScreeningResponse } from "@/lib/types";

type OcrFields = ScreeningResponse["module1_OCR"];

const ROW_LABELS: Record<keyof Omit<OcrFields, "mrz">, string> = {
  name: "Name",
  documentNumber: "Passport No.",
  dob: "Date of birth",
  expiry: "Expiry date",
  nationality: "Nationality",
};

export function OcrTable({ fields }: { fields: OcrFields }) {
  const [values, setValues] = useState(fields);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {(Object.keys(ROW_LABELS) as Array<keyof typeof ROW_LABELS>).map((key) => (
            <tr key={key} className="border-b border-border last:border-0">
              <th scope="row" className="w-36 py-2 pr-3 text-left align-middle text-xs font-normal text-slate-400">
                {ROW_LABELS[key]}
              </th>
              <td className="py-2 align-middle">
                {editingKey === key ? (
                  <input
                    autoFocus
                    value={values[key]}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    onBlur={() => setEditingKey(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                    className="w-full rounded border border-accent bg-slate-950 px-2 py-1 font-mono text-sm text-slate-100 outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingKey(key)}
                    className="group flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left font-mono text-slate-100 hover:bg-surface-raised"
                  >
                    {values[key]}
                    <Pencil
                      className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 rounded border border-border bg-slate-950 px-3 py-2">
        <p className="text-xs text-slate-500">MRZ</p>
        <pre className="mt-1 overflow-x-auto font-mono text-xs leading-5 text-slate-300">{values.mrz}</pre>
      </div>
    </div>
  );
}
