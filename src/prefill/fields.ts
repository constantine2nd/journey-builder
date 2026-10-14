import type { FormDefinition } from "../api/schema";

/** Field names of a form, in schema order. */
export function fieldNames(form: FormDefinition): string[] {
  return Object.keys(form.field_schema.properties);
}

/**
 * The fields a form can be prefilled into: everything except buttons, which
 * trigger actions rather than hold values. (Buttons are still offered as
 * source elements, as the reference picker shows.)
 */
export function prefillableFields(form: FormDefinition): string[] {
  return fieldNames(form).filter(
    (name) => form.field_schema.properties[name]?.avantos_type !== "button",
  );
}
