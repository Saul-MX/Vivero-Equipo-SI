import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, RUTA_INGRESO } from "@/lib/auth/constantes";

// Primera barrera, rápida: sin cookie de sesión no se entra a ninguna pantalla del panel.
// La verificación real (que la sesión exista y no haya vencido) se hace contra la base de datos
// en cada página y en cada acción del servidor, con requerirUsuario().
export function proxy(request: NextRequest) {
  if (!request.cookies.has(COOKIE_SESION)) {
    return NextResponse.redirect(new URL(RUTA_INGRESO, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo /panel excepto las pantallas de acceso (entrar y crear cuenta).
  matcher: ["/panel", "/panel/((?!ingresar|registro).*)"],
};
