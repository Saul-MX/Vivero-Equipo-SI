import type { ComponentProps } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Props = ComponentProps<typeof Input> & {
  id: string;
  etiqueta: string;
  /** Ayuda breve debajo del campo (como en las capturas del panel). */
  ayuda?: string;
  /** Mensaje de error ya traducido. */
  error?: string;
};

/** Campo de formulario con etiqueta, ayuda y error, enlazados para lectores de pantalla. */
export function CampoTexto({ id, etiqueta, ayuda, error, ...propsInput }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id} className="text-sm font-medium text-foreground">
        {etiqueta}
      </FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descritoPor}
        {...propsInput}
      />
      {ayuda && <FieldDescription id={idAyuda}>{ayuda}</FieldDescription>}
      {error && <FieldError id={idError}>{error}</FieldError>}
    </Field>
  );
}
