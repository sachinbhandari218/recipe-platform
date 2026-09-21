const TYPO_REPLACEMENTS = [
  [/\bcold\s+coffe\b/gi, "cold coffee"],
  [/\bcoffe\b/gi, "coffee"],
  [/\bgarlic\s+bred\b/gi, "garlic bread"],
  [/\bbred\b/gi, "bread"],
  [/\bpaner\b/gi, "paneer"],
  [/\bpanner\b/gi, "paneer"],
  [/\bnan\b/gi, "naan"],
  [/\bbriyani\b/gi, "biryani"],
  [/\bbiriyani\b/gi, "biryani"],
  [/\bpiza\b/gi, "pizza"],
  [/\bchiken\b/gi, "chicken"],
  [/\bchikn\b/gi, "chicken"],
  [/\bsamosha\b/gi, "samosa"],
  [/\bdhosa\b/gi, "dosa"],
  [/\bmomo\b/gi, "momos"],
  [/\bpaav\s+bhaji\b/gi, "pav bhaji"],
  [/\bpav\s+baji\b/gi, "pav bhaji"],
  [/\bchole\s+bature\b/gi, "chole bhature"],
  [/\bkulhad\s+chai\b/gi, "masala chai"],
  [/\bhakka\s+noodle\b/gi, "hakka noodles"]
];

const FORBIDDEN_IMAGE_PATTERNS = [
  "sign",
  "menu",
  "logo",
  "building",
  "street",
  "facade",
  "exterior",
  "interior",
  "storefront",
  "store",
  "window",
  "icon",
  "map",
  "diagram",
  "drawing",
  "flag",
  "poster",
  "billboard",
  ".svg",
  ".tif",
  ".pdf"
];

const CULINARY_PHOTO_DICTIONARY = [
  {
    keywords: ["cold coffee", "cold coffe", "iced coffee", "frappe", "cold brew", "iced latte", "frappuccino"],
    url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["coffee", "cappuccino", "latte", "espresso", "mocha", "macchiato", "cafe", "filter coffee"],
    url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["tea", "chai", "masala chai", "kulhad chai", "black tea", "green tea", "iced tea", "ginger tea"],
    url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["garlic bread", "garlic toast", "cheese garlic bread", "garlic baguette"],
    url: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["paneer naan", "butter naan", "garlic naan", "naan", "tandoori roti", "kulcha", "paratha"],
    url: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["paneer", "palak paneer", "shahi paneer", "matar paneer", "paneer tikka", "paneer butter masala", "kadai paneer", "cottage cheese"],
    url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["biryani", "dum biryani", "hyderabadi biryani", "chicken biryani", "mutton biryani", "pulao", "pulav", "fried rice"],
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["samosa", "singara", "kachori", "pakora", "pakoda", "bhajiya", "vada pav", "batata vada", "snack"],
    url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["pav bhaji", "bhaji pav", "tawa bhaji"],
    url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["dosa", "masala dosa", "idli", "uttapam", "vada", "sambar", "medu vada", "south indian"],
    url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["chole bhature", "bhature", "chana masala", "amritsari chole", "chole"],
    url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["pizza", "margherita", "pepperoni", "cheese pizza", "pan pizza", "thin crust pizza"],
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["burger", "cheeseburger", "veggie burger", "chicken burger", "slider", "whopper"],
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["pasta", "spaghetti", "macaroni", "penne", "lasagna", "fettuccine", "alfredo", "arrabbiata"],
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["noodles", "ramen", "chow mein", "hakka noodles", "pad thai", "maggi"],
    url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["momo", "momos", "dumpling", "dim sum", "gyoza", "wonton"],
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["butter chicken", "chicken tikka", "tandoori chicken", "chicken curry", "wings", "chicken"],
    url: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["mutton", "lamb", "rogan josh", "gosht", "keema", "meat", "kebab", "kabab"],
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["fish", "prawn", "prawns", "shrimp", "seafood", "salmon", "crab", "lobster"],
    url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["egg", "eggs", "omelet", "omelette", "scrambled egg", "bhurji", "shakshuka", "poached egg"],
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["dal", "lentil", "dal makhani", "dal tadka", "yellow dal", "rajma"],
    url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["curry", "gravy", "masala", "korma", "salan", "kofta"],
    url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["sandwich", "grilled cheese", "wrap", "roll", "frankie", "burrito", "taco", "tacos"],
    url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["pancake", "pancakes", "waffle", "waffles", "crepe"],
    url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["salad", "greens", "caesar salad", "bowl"],
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["soup", "broth", "stew", "chowder", "tomato soup", "corn soup"],
    url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["lassi", "smoothie", "shake", "milkshake", "mango lassi", "beverage", "juice", "lemonade", "cooler"],
    url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["kulfi", "ice cream", "gelato", "sundae", "popsicle", "popsicles"],
    url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["gulab jamun", "jalebi", "rasgulla", "halwa", "barfi", "ladoo", "laddu", "kaju katli", "sweet", "mithai"],
    url: "https://images.unsplash.com/photo-1605197161470-b998242c75aa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["cake", "chocolate cake", "pastry", "cupcake", "brownie", "muffin", "cheesecake", "tiramisu"],
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80"
  },
  {
    keywords: ["dessert", "pudding", "tart", "pie", "custard", "cookie", "cookies", "biscuit"],
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80"
  }
];

const DEFAULT_CULINARY_FALLBACK = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80";

function normalizeTitle(title) {
  let cleaned = String(title || "").trim().toLowerCase().replace(/[^\w\s-]/gi, " ");
  for (const [pattern, replacement] of TYPO_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

function isDisallowedMedia(titleStr, urlStr) {
  const check = (titleStr + " " + urlStr).toLowerCase();
  for (const pattern of FORBIDDEN_IMAGE_PATTERNS) {
    if (check.includes(pattern)) return true;
  }
  return false;
}

async function searchWikimediaCommons(searchQuery) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2600);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) return null;
    const data = await resp.json();
    const pages = (data && data.query && data.query.pages) ? Object.values(data.query.pages) : [];

    for (const page of pages) {
      const pageTitle = page.title || "";
      const infoList = page.imageinfo;
      if (!Array.isArray(infoList) || infoList.length === 0) continue;
      const info = infoList[0];
      const mime = info.mime || "";
      if (!mime.startsWith("image/jpeg") && !mime.startsWith("image/png") && !mime.startsWith("image/webp")) {
        continue;
      }
      const mediaUrl = info.thumburl || info.url;
      if (!mediaUrl) continue;
      if (isDisallowedMedia(pageTitle, mediaUrl)) continue;
      return mediaUrl;
    }
  } catch (e) {}
  return null;
}

async function searchWikipediaMedia(searchQuery) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=4&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2400);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) return null;
    const data = await resp.json();
    const pages = (data && data.query && data.query.pages) ? Object.values(data.query.pages) : [];
    for (const p of pages) {
      const src = (p.thumbnail && p.thumbnail.source) || (p.original && p.original.source);
      if (!src) continue;
      if (isDisallowedMedia(p.title || "", src)) continue;
      return src;
    }
  } catch (e) {}
  return null;
}

async function searchWikipediaSummary(searchQuery) {
  try {
    const formatted = encodeURIComponent(searchQuery.replace(/\s+/g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) return null;
    const data = await resp.json();
    const img = (data.originalimage && data.originalimage.source) || (data.thumbnail && data.thumbnail.source);
    if (img && !isDisallowedMedia(data.title || "", img)) {
      return img;
    }
  } catch (e) {}
  return null;
}

function findFromDictionary(normalizedDish) {
  for (const entry of CULINARY_PHOTO_DICTIONARY) {
    for (const kw of entry.keywords) {
      if (normalizedDish === kw || normalizedDish.includes(kw) || kw.includes(normalizedDish)) {
        return entry.url;
      }
    }
  }

  const words = normalizedDish.split(/\s+/).filter((w) => w.length >= 3);
  for (const entry of CULINARY_PHOTO_DICTIONARY) {
    for (const kw of entry.keywords) {
      for (const w of words) {
        if (kw.includes(w) || w.includes(kw)) {
          return entry.url;
        }
      }
    }
  }

  return null;
}

export async function searchOnlineDishPhoto(dishTitle) {
  if (!dishTitle || typeof dishTitle !== "string") {
    return DEFAULT_CULINARY_FALLBACK;
  }

  const normalized = normalizeTitle(dishTitle);
  if (!normalized) {
    return DEFAULT_CULINARY_FALLBACK;
  }

  const restaurantQuery = `${normalized} restaurant`;
  const commonsPhoto1 = await searchWikimediaCommons(restaurantQuery);
  if (commonsPhoto1) return commonsPhoto1;

  const commonsPhoto2 = await searchWikimediaCommons(`${normalized} restaurant food`);
  if (commonsPhoto2) return commonsPhoto2;

  const commonsPhoto3 = await searchWikimediaCommons(normalized);
  if (commonsPhoto3) return commonsPhoto3;

  const wikiPhoto = await searchWikipediaMedia(`${normalized} restaurant food dish`);
  if (wikiPhoto) return wikiPhoto;

  const summaryPhoto = await searchWikipediaSummary(normalized);
  if (summaryPhoto) return summaryPhoto;

  const dictMatch = findFromDictionary(normalized);
  if (dictMatch) return dictMatch;

  return DEFAULT_CULINARY_FALLBACK;
}

if (typeof window !== "undefined") {
  window.searchOnlineDishPhoto = searchOnlineDishPhoto;
}
