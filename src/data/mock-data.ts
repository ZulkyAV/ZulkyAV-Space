export type FolderStatus = "published" | "maintenance" | "draft" | "archived";

export interface Folder {
  slug: string;
  name: string;
  description: string;
  status: FolderStatus;
  count: number;
  accent: string;
}

export interface Note {
  slug: string;
  folderSlug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string[];
}

export interface Project {
  slug: string;
  folderSlug: string;
  title: string;
  description: string;
  status: string;
  image: string;
  updates: string[];
  components: string[];
}

export interface Product {
  slug: string;
  folderSlug: string;
  name: string;
  description: string;
  priceLabel: string;
  stock: "In stock" | "Low stock" | "Sold out";
  image: string;
  labels: string[];
}

export const profile = {
  name: "ZulkyAV",
  role: "Builder, maker, and curious mind.",
  intro: "A quiet corner for unfinished ideas, strange experiments, and small ventures slowly taking shape.",
  about: "I like turning questions into tangible things. This space is my living archive: a portfolio, a notebook, a workshop, and occasionally a small shop.",
  socials: [
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Instagram", href: "#" },
  ],
};

export const noteFolders: Folder[] = [
  { slug: "field-notes", name: "Field Notes", description: "Observations from building in public.", status: "published", count: 8, accent: "blue" },
  { slug: "small-essays", name: "Small Essays", description: "Thoughts that needed somewhere to land.", status: "published", count: 5, accent: "amber" },
  { slug: "workbench", name: "Workbench", description: "Experiments still finding their shape.", status: "maintenance", count: 3, accent: "green" },
  { slug: "drafts", name: "Drafts", description: "Not ready for the light yet.", status: "draft", count: 4, accent: "slate" },
];

export const notes: Note[] = [
  { slug: "the-useful-beauty-of-half-finished-things", folderSlug: "field-notes", title: "The useful beauty of half-finished things", excerpt: "A case for leaving room around an idea while it is still becoming.", date: "08 Aug 2024", readTime: "5 min read", tags: ["process", "making"], content: ["The first version of anything is a conversation with the unknown. It is less a declaration and more a question asked with your hands.", "I have started to see unfinished work differently. Not as evidence of a lack of discipline, but as a useful kind of evidence: a map of where curiosity was strongest.", "The trick is to keep the door open without keeping every door open. Choose one thread, give it a little light, and see whether it becomes a path.", "This space is an attempt to practice that kind of attention. Some things here will become useful. Some will simply teach me what to try next."] },
  { slug: "notes-from-a-slow-sunday", folderSlug: "field-notes", title: "Notes from a slow Sunday", excerpt: "On paying attention to the small systems that hold a week together.", date: "21 Jul 2024", readTime: "3 min read", tags: ["life", "rituals"], content: ["A slow day is not an empty day. It is a day where the edges become visible.", "I noticed the small rituals that make work feel possible: a clean desk, one good cup of coffee, a list that does not ask for everything at once.", "The best systems do not feel like systems. They quietly return us to the things we meant to do."] },
  { slug: "make-it-clear-before-making-it-clever", folderSlug: "small-essays", title: "Make it clear before making it clever", excerpt: "A reminder that a simple idea with a clean edge travels further.", date: "02 Jul 2024", readTime: "4 min read", tags: ["design", "clarity"], content: ["Cleverness is easy to notice. Clarity is easy to live with.", "Before adding another layer, I try to remove one. The result is usually less impressive in a room and more useful in the world.", "Good work leaves the person using it with more attention for what matters next."] },
];

export const projectFolders: Folder[] = [
  { slug: "active-builds", name: "Active builds", description: "Projects currently moving from sketch to reality.", status: "published", count: 3, accent: "blue" },
  { slug: "quiet-experiments", name: "Quiet experiments", description: "Small prototypes with interesting questions.", status: "published", count: 2, accent: "amber" },
  { slug: "on-pause", name: "On pause", description: "Good ideas waiting for the right season.", status: "maintenance", count: 2, accent: "slate" },
  { slug: "archive", name: "Archive", description: "Past experiments and lessons kept close.", status: "archived", count: 6, accent: "green" },
];

export const projects: Project[] = [
  { slug: "atlas-of-small-wins", folderSlug: "active-builds", title: "Atlas of Small Wins", description: "A gentle workspace for noticing progress that would otherwise disappear.", status: "In development", image: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200", updates: ["Shaped the first daily reflection flow.", "Testing a lighter way to browse past wins.", "Next: invite a small group of early readers."], components: ["Daily reflections", "Pattern library", "Personal timeline"] },
  { slug: "local-weather-station", folderSlug: "active-builds", title: "Local Weather Station", description: "A tiny physical-digital project about the weather right outside the window.", status: "Prototype", image: "https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=1200", updates: ["The first sensor is reporting reliably.", "Built a calm, glanceable display.", "Next: weatherproof the enclosure."], components: ["Sensor dashboard", "Ambient display", "Open data log"] },
  { slug: "the-reading-room", folderSlug: "quiet-experiments", title: "The Reading Room", description: "A slower way to keep track of what is worth returning to.", status: "Exploring", image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1200", updates: ["Collected the first set of reading notes.", "Exploring spatial navigation for ideas."], components: ["Reading notes", "Idea threads", "Private shelves"] },
];

export const productFolders: Folder[] = [
  { slug: "studio-goods", name: "Studio goods", description: "Small objects made with care and kept intentionally limited.", status: "published", count: 3, accent: "amber" },
  { slug: "digital-tools", name: "Digital tools", description: "Useful little things for a more considered workflow.", status: "published", count: 2, accent: "blue" },
  { slug: "seasonal", name: "Seasonal drops", description: "A new collection is being prepared.", status: "maintenance", count: 1, accent: "green" },
];

export const products: Product[] = [
  { slug: "field-notebook-set", folderSlug: "studio-goods", name: "Field notebook set", description: "Three pocket-sized notebooks for observations, sketches, and loose thoughts.", priceLabel: "From $18", stock: "In stock", image: "https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg?auto=compress&cs=tinysrgb&w=1200", labels: ["Best Seller", "Recommended"] },
  { slug: "brass-page-marker", folderSlug: "studio-goods", name: "Brass page marker", description: "A slim, tactile marker that gets better with use.", priceLabel: "$12", stock: "Low stock", image: "https://images.pexels.com/photos/1592786/pexels-photo-1592786.jpeg?auto=compress&cs=tinysrgb&w=1200", labels: ["Trending"] },
  { slug: "weekly-reset-kit", folderSlug: "digital-tools", name: "Weekly reset kit", description: "A calm printable and digital ritual for making space for the week ahead.", priceLabel: "$9", stock: "In stock", image: "https://images.pexels.com/photos/5905445/pexels-photo-5905445.jpeg?auto=compress&cs=tinysrgb&w=1200", labels: ["Recommended"] },
];

export const getPublicFolders = (folders: Folder[]): Folder[] => folders.filter((folder) => folder.status === "published" || folder.status === "maintenance");
export const getFolder = (folders: Folder[], slug: string): Folder | undefined => folders.find((folder) => folder.slug === slug);
