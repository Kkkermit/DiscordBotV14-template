// The documentation website, built with Starlight: https://starlight.astro.build
// It's published to GitHub Pages at https://kkkermit.github.io/DiscordBotV14-template/
// Using the template for your own bot? You can delete the website/ folder and .github/workflows/docs.yml.
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const REPOSITORY = 'https://github.com/Kkkermit/DiscordBotV14-template';
const SITE = 'https://kkkermit.github.io';
const BASE = '/DiscordBotV14-template';

export default defineConfig({
	site: SITE,
	base: BASE,
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: 'Discord Bot V14 Template',
			description:
				'Set up a Discord bot with discord.js v14 and Node.js: what you need, how to install the template, configure it and run your first bot.',
			logo: { src: './src/assets/logo.svg' },
			favicon: '/favicon.svg',
			head: [
				{ tag: 'meta', attrs: { property: 'og:image', content: `${SITE}${BASE}/social-preview.png` } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: REPOSITORY },
				{ icon: 'discord', label: 'Support server', href: 'https://discord.gg/xcMVwAVjSD' },
			],
			editLink: { baseUrl: `${REPOSITORY}/edit/develop/website/` },
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Setup',
					items: [
						'setup/quick-start',
						'setup/prerequisites',
						'setup/create-a-bot',
						'setup/installation',
						'setup/configuration',
						'setup/first-run',
					],
				},
				{
					label: 'Optional extras',
					items: ['extras/database', 'extras/docker'],
				},
				{
					label: 'Help',
					items: ['help/troubleshooting', 'help/next-steps'],
				},
			],
		}),
	],
});
