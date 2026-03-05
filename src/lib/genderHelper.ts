/**
 * Gender-aware greeting helper for Nova Silva dashboards.
 *
 * Heuristic:
 * 1. Check known female Hispanic names (~120)
 * 2. Check masculine exceptions ending in 'a'
 * 3. Apply typical feminine endings (-a, -ia, -ina, -ela)
 * 4. Default: "Bienvenido" (masculine grammatical fallback)
 *
 * For productor dashboard: accepts genero_demografico directly.
 */

const NOMBRES_FEMENINOS = new Set([
  'adriana', 'alejandra', 'alicia', 'alma', 'amparo', 'ana', 'andrea', 'angela',
  'angelica', 'araceli', 'aurora', 'beatriz', 'berenice', 'blanca', 'brenda',
  'camila', 'carla', 'carmen', 'carolina', 'catalina', 'cecilia', 'celia',
  'claudia', 'concepcion', 'cristina', 'daniela', 'diana', 'dolores', 'dulce',
  'edith', 'elena', 'elisa', 'elizabeth', 'elvira', 'emilia', 'erika',
  'esperanza', 'estefania', 'estela', 'eugenia', 'eva', 'evelyn',
  'fabiola', 'fatima', 'fernanda', 'flora', 'francisca', 'gabriela',
  'gloria', 'graciela', 'guadalupe', 'helena', 'ines', 'irene', 'iris',
  'isabel', 'ivonne', 'jazmin', 'jessica', 'jimena', 'josefa', 'josefina',
  'juana', 'julia', 'juliana', 'karen', 'karina', 'laura', 'leticia',
  'lidia', 'liliana', 'lourdes', 'lucia', 'luisa', 'luz', 'magdalena',
  'manuela', 'marcela', 'margarita', 'maria', 'mariana', 'maribel',
  'maricela', 'marina', 'marta', 'mercedes', 'micaela', 'miriam',
  'monica', 'nadia', 'nancy', 'natalia', 'nelly', 'norma', 'ofelia',
  'olga', 'olivia', 'paloma', 'pamela', 'patricia', 'paula', 'pilar',
  'raquel', 'rebeca', 'regina', 'reina', 'rocio', 'rosa', 'rosario',
  'ruth', 'sandra', 'sara', 'silvia', 'sofia', 'soledad', 'sonia',
  'susana', 'teresa', 'valentina', 'valeria', 'vanessa', 'veronica',
  'victoria', 'violeta', 'virginia', 'viviana', 'ximena', 'yolanda',
]);

const EXCEPCIONES_MASCULINAS = new Set([
  'joshua', 'elias', 'nicolas', 'tomas', 'matias', 'jonas', 'jeremias',
  'isaias', 'josue', 'garcia', 'borja', 'luca', 'nika',
]);

/**
 * Returns "Bienvenida" or "Bienvenido" based on input.
 *
 * @param nameOrGender - Either a full name (first name extracted) or a
 *   genero_demografico value ('femenino', 'masculino', etc.)
 */
export function getGreeting(nameOrGender: string | null | undefined): string {
  if (!nameOrGender) return 'Bienvenido';

  const input = nameOrGender.trim().toLowerCase();

  // Direct gender demographic values
  if (input === 'femenino') return 'Bienvenida';
  if (input === 'masculino') return 'Bienvenido';
  if (['no_binario', 'otro', 'prefiero_no_decir'].includes(input)) return 'Bienvenido';

  // Extract first name
  const firstName = input.split(/\s+/)[0];
  if (!firstName) return 'Bienvenido';

  // Check known female names
  if (NOMBRES_FEMENINOS.has(firstName)) return 'Bienvenida';

  // Check masculine exceptions
  if (EXCEPCIONES_MASCULINAS.has(firstName)) return 'Bienvenido';

  // Heuristic: typical feminine endings
  if (
    firstName.endsWith('a') ||
    firstName.endsWith('ia') ||
    firstName.endsWith('ina') ||
    firstName.endsWith('ela')
  ) {
    return 'Bienvenida';
  }

  return 'Bienvenido';
}
