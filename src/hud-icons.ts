/** Original SVG pixel symbols; only artwork is pixelated, text stays native and sharp. */
export function hudIcon(name:string){
  const paths:Record<string,string>={
    sun:'<path fill="#ed9e24" d="M7 0h2v3H7zM7 13h2v3H7zM0 7h3v2H0zM13 7h3v2h-3zM2 2h2v2H2zM12 2h2v2h-2zM2 12h2v2H2zM12 12h2v2h-2z"/><path fill="#ffe06c" d="M5 4h6v1h1v6h-1v1H5v-1H4V5h1z"/>',
    moon:'<path fill="#fff0ad" d="M7 1h4v2H8v3H6v4h3v2h4v-2h2v3h-3v2H6v-1H3v-3H1V6h2V3h4z"/><path fill="#fce9bb" d="M12 2h2v2h-2z"/>',
    rain:'<path fill="#c4e2de" d="M4 3h7v2h3v5H1V6h3z"/><path fill="#498aac" d="M3 11h2v3H3zM7 12h2v3H7zM11 11h2v3h-2z"/>',
    snow:'<path fill="#bcf0f0" d="M7 1h2v14H7zM1 7h14v2H1zM3 3h2v2H3zM5 5h2v2H5zM9 9h2v2H9zM11 11h2v2h-2zM11 3h2v2h-2zM9 5h2v2H9zM5 9h2v2H5zM3 11h2v2H3z"/>',
    leaf:'<path fill="#6d913c" d="M11 1h4v6h-2v3h-3v2H5v3H3v-4H1V6h3V3h7z"/><path fill="#b5bd51" d="M3 11h2V9h2V7h2V5h2V3h2v4h-2v2H9v2H7v2H3z"/>',
    star:'<path fill="#e49a2f" d="M7 1h2v4h5v3h-3v3h2v3H9v-2H7v2H3v-3h2V8H2V5h5z"/><path fill="#ffe17b" d="M7 5h2v3h3v1H9v2H7V9H4V8h3z"/>',
    coin:'<path fill="#93501e" d="M4 1h8v2h2v10h-2v2H4v-2H2V3h2z"/><path fill="#f7c655" d="M5 2h6v2h2v8h-2v2H5v-2H3V4h2z"/><path fill="#b97925" d="M7 4h3v2H8v4h2v2H7v-2H6V6h1z"/>',
    health:'<path fill="#9d393a" d="M2 3h4v2h4V3h4v2h2v5h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V5h2z"/><path fill="#e97560" d="M2 5h4v2h4V5h4v4h-2v2h-2v2H6v-2H4V9H2z"/>',
    stamina:'<path fill="#d7a536" d="M8 0h5L9 6h5L5 16H3l3-7H2z"/><path fill="#fff198" d="M8 2h2L6 8h4l-5 5 3-6H5z"/>',
    hunger:'<path fill="#8d6132" d="M2 5h2V3h8v2h2v8h-2v2H4v-2H2z"/><path fill="#e5aa62" d="M4 5h8v7H4z"/><path fill="#ffe4a6" d="M5 6h2v2H5zM9 9h2v2H9z"/>'
  };
  return `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${paths[name]??paths.leaf}</svg>`;
}
