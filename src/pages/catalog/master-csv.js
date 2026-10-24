// ---------------------------------------------------------------------------
// Bulk import: POST /admin/master-catalog/bulk { items } (1-500 rows)
// ---------------------------------------------------------------------------
const COLUMNS = [
  'name',
  'brand',
  'category',
  'categoryName',
  'unit',
  'barcode',
  'description',
  'tags',
  'suggestedPrice',
  'images',
];

export const MAX_ROWS = 500;

export const SAMPLE = `name,brand,categoryName,unit,suggestedPrice,barcode,tags
Shan Biryani Masala,Shan,Spices,50 g,140,8964000111223,masala|biryani
Nurpur Butter,Nurpur,Dairy,200 g,520,8964000334455,butter
Peek Freans Sooper,Peek Freans,Biscuits,Family pack,280,8964000556677,`;

// Splits one CSV (or tab-separated, pasted from a spreadsheet) line, honouring "quoted, cells".
function splitLine(line) {
  const cells = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === '\t') {
      cells.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

// Rows → API items. `tags` and `images` take several values separated by "|".
export function parseRows(text) {
  const [head, ...lines] = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!head) return [];
  const keys = splitLine(head).map((h) => COLUMNS.find((c) => c.toLowerCase() === h.toLowerCase()));
  return lines.map((line, i) => {
    const item = {};
    splitLine(line).forEach((cell, j) => {
      if (keys[j] && cell) item[keys[j]] = cell;
    });
    if (item.tags)
      item.tags = item.tags
        .split('|')
        .map((t) => t.trim())
        .filter(Boolean);
    if (item.images)
      item.images = item.images
        .split('|')
        .map((u) => u.trim())
        .filter(Boolean);
    if (item.suggestedPrice !== undefined) item.suggestedPrice = Number(item.suggestedPrice);
    const error = !item.name
      ? 'Missing name'
      : !item.category && !item.categoryName
        ? 'Missing category'
        : item.suggestedPrice !== undefined && !(item.suggestedPrice >= 0)
          ? 'Price is not a number'
          : '';
    return { item, line: i + 2, error };
  });
}
