import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Interview Notes",
  tagline:
    "Tài liệu ôn phỏng vấn — Fullstack · Backend · Frontend · React Native · System Design · DevOps · Behavioral",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true,
  },

  // Set the production url of your site here
  url: "https://docs.danny.io.vn",
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: "/",

  onBrokenLinks: "warn",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "vi",
    locales: ["vi"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Remove editUrl to disable "edit this page" links
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Interview Notes",
      items: [
        { to: "/docs/study-plan", label: "📅 Study Plan", position: "left" },
        { to: "/docs/algorithms", label: "Algorithms", position: "left" },
        { to: "/docs/backend", label: "Backend", position: "left" },
        { to: "/docs/frontend", label: "Frontend", position: "left" },
        { to: "/docs/react-native", label: "React Native", position: "left" },
        { to: "/docs/system-design", label: "System Design", position: "left" },
        { to: "/docs/frontend-system-design", label: "FE System Design", position: "left" },
        { to: "/docs/devops", label: "DevOps", position: "left" },
        { to: "/docs/behavioral", label: "Behavioral", position: "left" },
        { to: "/docs/cv/cv-deep-dive", label: "CV", position: "left" },
        {
          to: "/docs/poc-ai-builder",
          label: "PoC AI Builder",
          position: "left",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} Ho Thanh Danh. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "yaml", "tsx", "jsx"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
