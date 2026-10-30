import Image from "next/image";
import { urlImagen } from "@/lib/archivos/claves";
import { cn } from "@/lib/utils";

/**
 * Foto de perfil de quien da un testimonio. Si no se subió foto, se usa el avatar por defecto:
 * un círculo verde con la inicial del nombre. Es decorativo (el nombre se lee junto a él).
 */
export function AvatarTestimonio({
  avatar,
  nombre,
  className,
}: {
  avatar: string | null;
  nombre: string;
  className?: string;
}) {
  const clases = cn("size-12 shrink-0 rounded-full", className);
  if (avatar) {
    return (
      <Image src={urlImagen(avatar, "tarjeta")} alt="" width={96} height={96} unoptimized className={cn(clases, "object-cover")} />
    );
  }
  const inicial = nombre.trim().charAt(0).toLocaleUpperCase("es-MX") || "?";
  return (
    <span
      aria-hidden
      data-avatar="por-defecto"
      className={cn(clases, "flex items-center justify-center bg-hoja font-serif text-lg font-semibold text-white")}
    >
      {inicial}
    </span>
  );
}
