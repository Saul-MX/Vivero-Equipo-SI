import { useCallback, useId, type ChangeEvent, type ComponentProps, type ReactNode, type Ref, type RefObject } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Selector } from "@/components/ui/selector";
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

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** ¿La persona (o el autocompletado del navegador) cambió el campo después de que llegó la página? */
function cambiadoEnLaPagina(control: Control) {
  if (control instanceof HTMLSelectElement) return [...control.options].some((o) => o.selected !== o.defaultSelected);
  if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) return false;
  return control.value !== control.defaultValue;
}

/** Entrega el control a la referencia que haya recibido el campo (la de React Hook Form, por ejemplo). */
function asignarRef<T>(ref: Ref<T> | undefined, control: T | null) {
  if (typeof ref === "function") ref(control);
  else if (ref) (ref as RefObject<T | null>).current = control;
}

/**
 * Conserva lo que se escribió ANTES de que la página terminara de cargar.
 *
 * En un celular lento el formulario se ve (y se puede escribir en él) antes de que React lo active.
 * Al activarse, React Hook Form pone en cada campo su valor inicial y borraba lo escrito (también
 * lo que llenó el autocompletado del navegador). Aquí se guarda ese texto, se deja que el formulario
 * registre el campo y, si lo cambió, se regresa y se le avisa como si se acabara de escribir.
 */
function useConservarLoEscrito<T extends Control>(ref: Ref<T> | undefined, onChange: ((evento: ChangeEvent<T>) => unknown) | undefined) {
  return useCallback(
    (control: T | null) => {
      const escrito = control && cambiadoEnLaPagina(control) ? control.value : null;
      asignarRef(ref, control);
      if (control && escrito !== null && control.value !== escrito) {
        control.value = escrito;
        void onChange?.({ target: control, currentTarget: control, type: "change" } as ChangeEvent<T>);
      }
    },
    [ref, onChange],
  );
}

/** Etiqueta, ayuda y error alrededor de un control, enlazados para lectores de pantalla. */
function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  claseCampo,
  control,
}: PropsComunes & { control: (accesibilidad: ComponentProps<"input">) => ReactNode }) {
  // Next conserva ocultas algunas pantallas ya visitadas (para volver al instante): con un id
  // único, la etiqueta nunca queda ligada a un campo de otra pantalla que tenga el mismo nombre.
  const idUnico = `${id}-${useId()}`;
  const idAyuda = ayuda ? `${idUnico}-ayuda` : undefined;
  const idError = error ? `${idUnico}-error` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <Field data-invalid={error ? true : undefined} className={claseCampo}>
      <FieldLabel htmlFor={idUnico} className="text-sm font-medium text-foreground">
        {etiqueta}
      </FieldLabel>
      {control({ id: idUnico, "aria-invalid": error ? true : undefined, "aria-describedby": descritoPor })}
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
  ref,
  onChange,
  ...propsInput
}: PropsComunes & ComponentProps<typeof Input>) {
  const refConservador = useConservarLoEscrito(ref, onChange);
  return (
    <Campo
      {...{ id, etiqueta, ayuda, error, claseCampo }}
      control={(accesibilidad) => <Input {...accesibilidad} {...propsInput} ref={refConservador} onChange={onChange} />}
    />
  );
}

export function CampoSelector({
  id,
  etiqueta,
  ayuda,
  error,
  claseCampo,
  ref,
  onChange,
  ...propsSelector
}: PropsComunes & ComponentProps<typeof Selector>) {
  const refConservador = useConservarLoEscrito(ref, onChange);
  return (
    <Campo
      {...{ id, etiqueta, ayuda, error, claseCampo }}
      control={(accesibilidad) => (
        <Selector
          id={accesibilidad.id}
          aria-invalid={accesibilidad["aria-invalid"]}
          aria-describedby={accesibilidad["aria-describedby"]}
          {...propsSelector}
          ref={refConservador}
          onChange={onChange}
        />
      )}
    />
  );
}

export function CampoAreaTexto({
  id,
  etiqueta,
  ayuda,
  error,
  claseCampo,
  ref,
  onChange,
  ...propsArea
}: PropsComunes & ComponentProps<typeof Textarea>) {
  const refConservador = useConservarLoEscrito(ref, onChange);
  return (
    <Campo
      {...{ id, etiqueta, ayuda, error, claseCampo }}
      control={(accesibilidad) => (
        <Textarea
          id={accesibilidad.id}
          aria-invalid={accesibilidad["aria-invalid"]}
          aria-describedby={accesibilidad["aria-describedby"]}
          {...propsArea}
          ref={refConservador}
          onChange={onChange}
        />
      )}
    />
  );
}
