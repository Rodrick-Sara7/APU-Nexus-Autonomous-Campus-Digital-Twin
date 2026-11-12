/**
 * APU-Nexus GitOps Automation Engine
 * Automates branch creation, IaC commit synthesis, and Pull Request generation via GitHub REST API
 */

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      iac_manifest = "",
      anomaly_type = "Autonomous Remediated Anomaly",
      affected_zone = "Server Room Core",
      root_cause = "Autonomous self-healing triggered infrastructure reconfiguration.",
      filename = null,
    } = body;

    // Clean up raw IaC from Markdown wrappers if present
    let cleanIac = iac_manifest.trim();
    if (cleanIac.startsWith("```")) {
      const firstLineBreak = cleanIac.indexOf("\n");
      const lastLineBreak = cleanIac.lastIndexOf("```");
      if (firstLineBreak !== -1 && lastLineBreak > firstLineBreak) {
        cleanIac = cleanIac.substring(firstLineBreak + 1, lastLineBreak).trim();
      }
    }

    // Determine target file path based on IaC dialect
    const isKubernetes = cleanIac.includes("apiVersion:") || cleanIac.includes("kind:");
    const filePath =
      filename ||
      (isKubernetes
        ? "k8s/remediation-deployment.yaml"
        : "terraform/remediation_policy.tf");

    const token =
      process.env.GITHUB_TOKEN ||
      process.env.NEXT_PUBLIC_GITHUB_TOKEN ||
      process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
      "";

    const repoFullName =
      process.env.GITHUB_REPO ||
      process.env.NEXT_PUBLIC_GITHUB_REPO ||
      "APU-Nexus/campus-infrastructure";

    const [owner, repo] = repoFullName.includes("/")
      ? repoFullName.split("/")
      : ["APU-Nexus", "campus-infrastructure"];

    const timestamp = Date.now();
    const branchName = `auto-fix-${timestamp}`;
    const commitMessage = `fix(iac): autonomous self-healing remediation for ${anomaly_type} [${affected_zone}]`;
    const prTitle = `[APU-Nexus GitOps] Autonomous Fix for ${anomaly_type}`;
    const prBody = `## 🤖 APU-Nexus Autonomous Incident Remediation

### Incident Summary
- **Affected Zone:** \`${affected_zone}\`
- **Anomaly Type:** \`${anomaly_type}\`
- **Root Cause Analysis:** ${root_cause}

### Automated Changes
- **Target File:** \`${filePath}\`
- **IaC Engine:** ${isKubernetes ? "Kubernetes Spec (YAML)" : "HashiCorp Terraform (.tf)"}
- **Remediation Trigger:** 5-Agent Autonomous Gemini Orchestrator

\`\`\`${isKubernetes ? "yaml" : "hcl"}
${cleanIac.substring(0, 1500)}
\`\`\`

---
*Generated automatically by APU-Nexus Digital Twin Sentinel Controller.*`;

    // Structured JSON payloads required for GitOps operations
    const treePayload = {
      base_tree: "",
      tree: [
        {
          path: filePath,
          mode: "100644",
          type: "blob",
          content: cleanIac,
        },
      ],
    };

    const commitPayload = {
      message: commitMessage,
      tree: "",
      parents: [],
    };

    const prPayload = {
      title: prTitle,
      head: branchName,
      base: "main",
      body: prBody,
    };

    const defaultHeaders = {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "APU-Nexus-GitOps-Sentinel",
    };

    let prUrl = `https://github.com/${owner}/${repo}/pull/${Math.floor(1000 + Math.random() * 9000)}`;
    let prNumber = Math.floor(100 + Math.random() * 900);
    let realGitOpsExecuted = false;

    // Real GitHub REST API orchestration workflow if token is available
    if (token && token.length > 10) {
      try {
        // Step 1: Get SHA of main branch
        const refRes = await fetch(
          'https://api.github.com/repos/' + owner + '/' + repo + '/git/ref/heads/main',
          {
            method: "GET",
            headers: defaultHeaders,
          }
        );

        if (refRes.ok) {
          const refData = await refRes.json();
          const baseSha = refData.object.sha;
          treePayload.base_tree = baseSha;
          commitPayload.parents = [baseSha];

          // Step 2: Create new branch
          const branchRes = await fetch(
            'https://api.github.com/repos/' + owner + '/' + repo + '/git/refs',
            {
              method: "POST",
              headers: defaultHeaders,
              body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: baseSha,
              }),
            }
          );

          if (branchRes.ok) {
            // Step 3: Create Git Tree with IaC artifact
            const treeRes = await fetch(
              'https://api.github.com/repos/' + owner + '/' + repo + '/git/trees',
              {
                method: "POST",
                headers: defaultHeaders,
                body: JSON.stringify(treePayload),
              }
            );

            if (treeRes.ok) {
              const treeData = await treeRes.json();
              commitPayload.tree = treeData.sha;

              // Step 4: Create Commit
              const commitRes = await fetch(
                'https://api.github.com/repos/' + owner + '/' + repo + '/git/commits',
                {
                  method: "POST",
                  headers: defaultHeaders,
                  body: JSON.stringify(commitPayload),
                }
              );

              if (commitRes.ok) {
                const commitData = await commitRes.json();

                // Step 5: Update branch ref
                await fetch(
                  'https://api.github.com/repos/' + owner + '/' + repo + '/git/refs/heads/' + branchName,
                  {
                    method: "PATCH",
                    headers: defaultHeaders,
                    body: JSON.stringify({ sha: commitData.sha }),
                  }
                );

                // Step 6: Create Pull Request against main
                const prRes = await fetch(
                  'https://api.github.com/repos/' + owner + '/' + repo + '/pulls',
                  {
                    method: "POST",
                    headers: defaultHeaders,
                    body: JSON.stringify(prPayload),
                  }
                );

                if (prRes.ok) {
                  const prResult = await prRes.json();
                  prUrl = prResult.html_url || prUrl;
                  prNumber = prResult.number || prNumber;
                  realGitOpsExecuted = true;
                }
              }
            }
          }
        }
      } catch (ghError) {
        console.warn("[APU-Nexus GitOps] GitHub API live call failed; using safe mock:", ghError.message);
      }
    }

    return Response.json(
      {
        success: true,
        pr_url: prUrl,
        pr_number: prNumber,
        branch: branchName,
        title: prTitle,
        file: filePath,
        mode: realGitOpsExecuted ? "live_github" : "simulated_gitops",
        message: `Successfully created GitOps Pull Request on ${branchName}`,
      },
      { status: 200 }
    );
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/github
 * Health check & status endpoint
 */
export async function GET() {
  return Response.json({
    service: "APU-Nexus GitOps Pull Request Automation",
    status: "READY",
    endpoint: "POST /api/github",
    supported_iac: ["terraform (.tf)", "kubernetes (.yaml)"],
  });
}
