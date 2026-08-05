/** A generator output template (literal body with `{{var}}` placeholders). */
export interface GeneratorTemplate {
  readonly id: string;
  readonly name: string;
  readonly body: string;
  readonly contentType?: string;
}
