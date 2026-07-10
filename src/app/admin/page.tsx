import { checkAdminSession } from "./actions";
import LoginForm from "./LoginForm";
import AdminDashboard from "./AdminDashboard";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { toProduct } from "@/lib/products-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuthenticated = await checkAdminSession();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Fetch all products (up to 1000 items) for listing
  const result = await fetchQuery(api.products.list, {
    paginationOpts: {
      numItems: 1000,
      cursor: null,
    },
  });

  const products = result.page.map(toProduct);

  return <AdminDashboard initialProducts={products} />;
}
