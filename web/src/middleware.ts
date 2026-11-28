import { NextResponse, type NextRequest } from "next/server";

// Control de acceso a las páginas (se ejecuta antes de mostrar cada página).
// Solo revisa si existe la cookie de sesión: quien valida de verdad es el backend.
// - Sin sesión → al login (recordando a dónde iba).
// - Con sesión y en el login → al inicio.
export function middleware(req: NextRequest) {
  const tieneSesion = req.cookies.has("ec_sesion");
  const enLogin = req.nextUrl.pathname.startsWith("/login");

  if (!tieneSesion && !enLogin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("volver", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (tieneSesion && enLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

// No aplica a la API, a los archivos internos de Next.js ni a las imágenes públicas
// (los logos deben cargar en el login, cuando todavía no hay sesión)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logos/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
