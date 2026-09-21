"use client";
import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Download, Printer, AlertCircle } from "lucide-react";
import { isValidEan13 } from "@/lib/inventory/barcode";

interface BarcodeRendererProps {
  code: string | null | undefined;
  symbology?: "CODE128" | "EAN13" | string | null;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  showActions?: boolean;
  productName?: string;
  price?: number;
  unit?: string;
  className?: string;
}

export function BarcodeRenderer({
  code,
  symbology = "CODE128",
  width = 1.6,
  height = 50,
  displayValue = true,
  fontSize = 13,
  showActions = false,
  productName,
  price,
  unit,
  className = "",
}: BarcodeRendererProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanCode = code ? String(code).trim() : "";

  useEffect(() => {
    if (!cleanCode || !svgRef.current) {
      setError(null);
      return;
    }

    try {
      // Use EAN13 only if valid 13-digit code; otherwise fallback safely to CODE128
      const format =
        symbology === "EAN13" && isValidEan13(cleanCode) ? "EAN13" : "CODE128";

      JsBarcode(svgRef.current, cleanCode, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        font: "monospace",
        fontOptions: "bold",
        textMargin: 3,
        margin: 6,
        background: "transparent",
        lineColor: "#0f172a",
        valid: (valid) => {
          if (!valid) {
            setError("Invalid barcode format");
          } else {
            setError(null);
          }
        },
      });
    } catch (err: any) {
      console.warn("JsBarcode render error:", err);
      setError("Unable to render barcode");
    }
  }, [cleanCode, symbology, width, height, displayValue, fontSize]);

  if (!cleanCode) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-slate-500">
        No Barcode Assigned
      </span>
    );
  }

  const handleDownload = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode_${cleanCode}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow || !svgRef.current) return;

    const svgHtml = svgRef.current.outerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${cleanCode}</title>
          <style>
            @page { size: 50mm 25mm; margin: 0; }
            body {
              font-family: sans-serif;
              margin: 0;
              padding: 4px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              box-sizing: border-box;
            }
            .title { font-size: 9px; font-weight: bold; max-width: 48mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .meta { font-size: 8px; color: #333; margin-top: 1px; }
            svg { max-width: 46mm; height: auto; max-height: 14mm; margin-top: 2px; }
          </style>
        </head>
        <body>
          ${productName ? `<div class="title">${productName}</div>` : ""}
          ${price !== undefined ? `<div class="meta">₹${(price / 100).toFixed(2)} ${unit ? `• ${unit}` : ""}</div>` : ""}
          ${svgHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {error ? (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-2xs font-medium text-amber-800 border border-amber-200">
          <AlertCircle size={12} /> {error} ({cleanCode})
        </span>
      ) : (
        <div className="flex flex-col items-center bg-white p-1 rounded border border-slate-200 shadow-2xs">
          <svg ref={svgRef} className="max-w-full" />
          {showActions && (
            <div className="mt-1 flex items-center gap-1.5 pt-1 border-t border-slate-100 w-full justify-center">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-2xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                title="Print thermal label"
              >
                <Printer size={11} /> Print
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-2xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                title="Download SVG"
              >
                <Download size={11} /> SVG
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
