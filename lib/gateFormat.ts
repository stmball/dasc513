import type { GateFormat } from "./types";

export const FORMAT_LABEL: Record<GateFormat, string> = {
  inbox: "Inbox",
  chat: "Chat channel",
  wiki: "Wiki",
  blog: "Blog",
  brochure: "Marketing site",
  archive: "Archive",
  tickets: "Service desk",
  papers: "Papers portal",
};

export const FORMAT_LAUNCH_LABEL: Record<GateFormat, string> = {
  inbox: "Open the inbox",
  chat: "Open the channel",
  wiki: "Open the wiki",
  blog: "Open the blog",
  brochure: "Open the site",
  archive: "Open the archive",
  tickets: "Open the service desk",
  papers: "Open the papers portal",
};
