import type { ComponentProps, ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PropsComunes = {
  id: string;
  etiqueta: string;
  /** Ayuda breve debajo del campo (como en las capturas del panel). */
  ayuda?: string;
  /** Mensaje de error ya traducido. */
  error?: string;
  /** Clases del contenedor del campo (por ejemplo, para ocupar dos columnas). */
  claseCampo?: string;
};

/** Etiqueta, ayuda y error alrededor de un control, enlazados para lectores de pantalla. */
function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  claseCampo,
  control,
}: PropsComunes & { control: (accesibilidad: ComponentProps<"input">) => ReactNode }) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <Field data-invalid={error ? true : undefined} className={claseCampo}>
      <FieldLabel htmlFor={id} className="text-sm font-medium text-foreground">
        {etiqueta}
      </FieldLabel>
      {control({ id, "aria-invalid": error ? true : undefined, "aria-describedby": descritoPor })}
      {ayuda && <FieldDescription id={idAyuda}>{ayuda}</FieldDescription>}
      {error && <FieldError id={idError}>{error}</FieldError>}
    </Field>
  );
}

export function CampoTexto({
  id,
  etiqueta,
  ayuda,
  error,
  claseCampo,
  ...propsInput
}: PropsComunes & ComponentProps<typeof Input>) {
  return (
    <Campo
      {...{ id, etiqueta, ayuda, error, claseCampo }}
      control={(accesibilidad) => <Input {...accesibilidad} {...propsInput} />}
    />
  );
}

export function CampoAreaTexto({
  id,
  etiqueta,
  ayuda,
  error,
  claseCampo,
  ...propsArea
}: PropsComunes & ComponentProps<typeof Textarea>) {
  return (
    <Campo
      {...{ id, etiqueta, ayuda, error, claseCampo }}
      control={(accesibilidad) => (
        <Textarea
          id={accesibilidad.id}
          aria-invalid={accesibilidad["aria-invalid"]}
          aria-describedby={accesibilidad["aria-describedby"]}
          {...propsArea}
        />
      )}
    />
  );
}
