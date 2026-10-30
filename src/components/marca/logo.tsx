import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Logotipo provisional: el nombre del vivero en tipografía serif.
// Cuando exista el logotipo, basta con reemplazar el contenido de este componente
// por la imagen (next/image); todas las pantallas lo usan desde aquí.

const TAMANOS = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl sm:text-5xl",
} as const;

type Props = {
  /** «claro» para fondos oscuros (menú del panel, portada); «oscuro» para fondos claros. */
  tono?: "claro" | "oscuro";
  tamano?: keyof typeof TAMANOS;
  /** Muestra «Atlixco, Puebla» debajo del nombre. */
  conLugar?: boolean;
  className?: string;
};

export function Logo({ tono = "oscuro", tamano = "md", conLugar = false, className }: Props) {
  const t = useTranslations("marca");

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-serif font-semibold tracking-tight",
          TAMANOS[tamano],
          tono === "claro" ? "text-white" : "text-pino",
        )}
      >
        {t("nombre")}
      </span>
      {conLugar && (
        <span
          className={cn(
            "mt-2 text-xs font-medium tracking-[0.2em] uppercase",
            tono === "claro" ? "text-crema" : "text-texto-suave",
          )}
        >
          {t("lugar")}
        </span>
      )}
    </span>
  );
}
