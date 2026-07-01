export async function startGithubAppInstall(projectId: string) {
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG?.trim();

  if (!appSlug) {
    throw new Error("GitHub App slug is not configured");
  }

  const installWindow = window.open("about:blank", "_blank");
  if (installWindow) {
    installWindow.opener = null;
    try {
      installWindow.document.title = "Opening GitHub...";
      installWindow.document.body.innerHTML =
        '<div style="background:#0b0b0c;color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">Opening GitHub...</div>';
    } catch {
      // Some browsers restrict access even for blank popups.
    }
  }

  try {
    const response = await fetch(`/api/projects/${projectId}/github-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createInstallationState: true }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to start GitHub connection");
    }
    if (typeof data.state !== "string" || !data.state) {
      throw new Error("GitHub connection state was not returned");
    }

    const githubAppUrl = `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(
      data.state
    )}`;

    if (installWindow && !installWindow.closed) {
      installWindow.location.assign(githubAppUrl);
      return;
    }

    window.location.assign(githubAppUrl);
  } catch (error) {
    if (installWindow && !installWindow.closed) {
      installWindow.close();
    }
    throw error;
  }
}

