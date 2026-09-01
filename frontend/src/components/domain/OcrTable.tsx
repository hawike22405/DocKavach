import type { ScreeningResponse } from "@/lib/types";

export function OcrTable({ data }: { data: ScreeningResponse["module1_OCR"] }) {
  const rows = [
    ["Name", data.name],
    ["Document number", data.documentNumber],
    ["Date of birth", data.dob],
    ["Expiry", data.expiry],
    ["Nationality", data.nationality],
  ];

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-border last:border-0">
              <th className="w-1/3 px-3 py-2 text-left font-medium text-slate-400">{label}</th>
              <td className="px-3 py-2 text-slate-200">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border px-3 py-2">
        <p className="mb-1 text-xs font-medium text-slate-500">MRZ</p>
        <pre className="whitespace-pre-wrap break-all font-mono text-xs text-slate-300">{data.mrz}</pre>
      </div>
    </div>
  );
}
