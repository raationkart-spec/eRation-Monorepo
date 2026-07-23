"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500"
      >
        <ChevronLeft size={16} /> Products
      </Link>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">New Product</h1>
      <ProductForm />
    </div>
  );
}
