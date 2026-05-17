export const LANGUAGES = [
  { name: "JavaScript", id: 63, monaco: "javascript", extensions: [".js", ".jsx", ".mjs"] },
  { name: "Python", id: 71, monaco: "python", extensions: [".py"] },
  { name: "C++", id: 54, monaco: "cpp", extensions: [".cpp", ".cc", ".cxx", ".h", ".hpp"] },
];

export const DEFAULT_LANGUAGE_ID = 63;

export function getLanguageById(id) {
  return LANGUAGES.find((lang) => lang.id === id) ?? LANGUAGES[0];
}

export function getLanguageFromFilename(filename) {
  const lower = filename.toLowerCase();
  for (const lang of LANGUAGES) {
    if (lang.extensions.some((ext) => lower.endsWith(ext))) {
      return lang;
    }
  }
  return LANGUAGES[0];
}

export function getMonacoLanguage(filename) {
  return getLanguageFromFilename(filename).monaco;
}

export function getDefaultFilename(languageId) {
  const lang = getLanguageById(languageId);
  switch (lang.monaco) {
    case "python":
      return "main.py";
    case "cpp":
      return "main.cpp";
    default:
      return "main.js";
  }
}
