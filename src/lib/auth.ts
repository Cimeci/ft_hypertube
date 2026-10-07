import {betterAuth, OAuth2Tokens} from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {genericOAuth, GenericOAuthConfig, GenericOAuthUserInfo} from "better-auth/plugins";
import { prisma } from "./prisma";

export interface Provider {
  name: string;
  backgroundColor: string;
  textColor: string;
  clientId: string;
  clientSecret: string;
  config?: Omit<GenericOAuthConfig, "providerId" | "clientId" | "clientSecret">;
}

export const Providers: Record<string, Provider> = {
  intra: {
    name: "42",
    backgroundColor: "#000000",
    textColor: "#FFF",
    clientId: process.env.INTRA_CLIENT_ID as string,
    clientSecret: process.env.INTRA_CLIENT_SECRET as string,
    config: {
      authorizationUrl: "https://api.intra.42.fr/oauth/authorize",
      tokenUrl: "https://api.intra.42.fr/oauth/token",
      scopes: ["public"],
      userInfoUrl: "https://api.intra.42.fr/v2/me",
    }
  },
  linkedin: {
    name: "LinkedIn",
    backgroundColor: "#0077B5",
    textColor: "#FFF",
    clientId: process.env.LINKEDIN_CLIENT_ID as string,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
  },
  twitch: {
    name: "Twitch",
    backgroundColor: "#8956fb",
    textColor: "#FFF",
    clientId: process.env.TWITCH_CLIENT_ID as string,
    clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
  },
  tiktok: {
    name: "TikTok",
    backgroundColor: "#000000",
    textColor: "#FFF",
    clientId: process.env.TIKTOK_CLIENT_ID as string,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET as string,
  },
  slack: {
    name: "Slack",
    backgroundColor: "#4A154B",
    textColor: "#FFF",
    clientId: process.env.SLACK_CLIENT_ID as string,
    clientSecret: process.env.SLACK_CLIENT_SECRET as string,
  },
  linear: {
    name: "Linear",
    backgroundColor: "#222326",
    textColor: "#FFF",
    clientId: process.env.LINEAR_CLIENT_ID as string,
    clientSecret: process.env.LINEAR_CLIENT_SECRET as string,
  },
  figma: {
    name: "Figma",
    backgroundColor: "#FFFFFF",
    textColor: "#000",
    clientId: process.env.FIGMA_CLIENT_ID as string,
    clientSecret: process.env.FIGMA_CLIENT_SECRET as string,
  },
  notion: {
    name: "Notion",
    backgroundColor: "#ffffff",
    textColor: "#000",
    clientId: process.env.NOTION_CLIENT_ID as string,
    clientSecret: process.env.NOTION_CLIENT_SECRET as string,
  },
  wikipedia: {
    name: "Wikipedia",
    backgroundColor: "#F9F9F0",
    textColor: "#000",
    clientId: process.env.WIKIPEDIA_CLIENT_ID as string,
    clientSecret: process.env.WIKIPEDIA_CLIENT_SECRET as string,
    config: {
      authorizationUrl: "https://meta.wikimedia.org/w/rest.php/oauth2/authorize",
      tokenUrl: "https://meta.wikimedia.org/w/rest.php/oauth2/access_token",
      scopes: [],
      pkce: false,
      getUserInfo: WikipediaGetUserInfo,
    }
  },
  huggingface: {
    name: "HuggingFace",
    backgroundColor: "#FFD21E",
    textColor: "#000",
    clientId: process.env.HUGGINGFACE_CLIENT_ID as string,
    clientSecret: process.env.HUGGINGFACE_CLIENT_SECRET as string,
  },
  openstreetmap: {
    name: "OpenStreetMap",
    backgroundColor: "#7EBC6F",
    textColor: "#FFF",
    clientId: process.env.OSM_CLIENT_ID as string,
    clientSecret: process.env.OSM_CLIENT_SECRET as string,
    config: {
      authorizationUrl: "https://www.openstreetmap.org/oauth2/authorize",
      tokenUrl: "https://www.openstreetmap.org/oauth2/token",
      scopes: ["openid"],
    }
  },
  epic: {
    name: "Epic Games",
    backgroundColor: "#2F2D2E",
    textColor: "#FFF",
    clientId: process.env.EPIC_CLIENT_ID as string,
    clientSecret: process.env.EPIC_CLIENT_SECRET as string,
    config: {
      authorizationUrl: "https://www.epicgames.com/id/api/redirect",
      tokenUrl: "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
      scopes: ["basic_profile"],
    }
  },
  roblox: {
    name: "Roblox",
    backgroundColor: "#3058F8",
    textColor: "#FFF",
    clientId: process.env.ROBLOX_CLIENT_ID as string,
    clientSecret: process.env.ROBLOX_CLIENT_SECRET as string,
  },
}

async function WikipediaGetUserInfo(tokens: OAuth2Tokens): Promise<GenericOAuthUserInfo | null> {
  const f: Response = await fetch(
      "https://fr.wikipedia.org/w/rest.php/oauth2/resource/profile",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "User-Agent": "lostmedia_42/1.0",
        },
      }
  );
  if (!f.ok) return null;
  const j = await f.json();
  return {
    id: String(j.sub),
    name: j.username ?? "Wikimedia User",
    email: j.email ?? `${j.sub}@wikipedia.placeholder.invalid`,
    emailVerified: Boolean(j.email),
  };
}

export const Auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: "http://localhost:3000/",
  emailAndPassword: {
    enabled: true
  },
  socialProviders: Object.fromEntries(
      Object.entries(Providers)
          .filter(([, provider]) => provider.config === undefined)
          .map(([id, provider]) => [
            id,
            {
              clientId: provider.clientId,
              clientSecret: provider.clientSecret,
            },
          ])
  ),
  plugins: [
    genericOAuth({
      config: Object.entries(Providers)
          .filter(([, provider]) => provider.config !== undefined)
          .map(([id, provider]) => ({
            providerId: id,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            ...provider.config
          }))
    })
  ]
});