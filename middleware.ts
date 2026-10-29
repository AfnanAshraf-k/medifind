import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const pathname = request.nextUrl.pathname;

  // Dedicated admin login page is public
  if (pathname === "/admin/login") {
    return response;
  }

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isProtectedRoute =
    isAdminRoute ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/pharmacy/dashboard" ||
    pathname.startsWith("/pharmacy/dashboard/");

  // Allow public pages immediately without blocking
  if (!isProtectedRoute) {
    return response;
  }

  // Check if any Supabase session cookie is present
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.value);

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminRoute ? "/admin/login" : "/login";
    return NextResponse.redirect(url);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute ? "/admin/login" : "/login";
      return NextResponse.redirect(url);
    }

    // Role-based protection for admin routes
    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_suspended")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin" || profile.is_suspended) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }
    }
  } catch (err) {
    console.warn("Middleware auth verification deferred to client:", (err as any)?.message);
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
