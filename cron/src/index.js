// Starts GitHub workflows on time, because GitHub's own schedule skips most hours. A trailer's 24-hour view
// figure needs a snapshot on each side of its 24-hour mark, and Rerun promises listings read every hour.
const WORKFLOWS = {
	"11 * * * *": ["doomedforce/trailermath", "build.yml"], // hourly: refresh data and deploy
	"0 15 * * 1": ["doomedforce/trailermath", "drop.yml"], // Mondays 8am Pacific: draft The Drop in Buttondown
	"17 * * * *": ["doomedforce/Rerun", "deploy.yml"], // hourly: refresh listings and deploy
};

export default {
	async scheduled(controller, env) {
		const [repo, workflow] = WORKFLOWS[controller.cron] ?? [];
		if (!workflow) throw new Error(`No workflow for schedule "${controller.cron}"`);
		const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.GITHUB_TOKEN}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "trailermath-cron",
			},
			body: JSON.stringify({ ref: "main" }),
		});
		// Throwing marks the run as failed in the Worker's logs, so a revoked token is visible.
		if (!res.ok) throw new Error(`GitHub dispatch of ${repo} ${workflow} failed: ${res.status} ${await res.text()}`);
	},
};
