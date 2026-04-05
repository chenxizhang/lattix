import { renderNavbar } from './navbar';
import { submitTask, listTaskFiles, readFileContent, discoverNodes, checkWorkspaceExists } from '../graph';
import { formatDate } from '../utils';
import { showToast } from '../utils';
import type { TaskFile } from '../types';

export async function renderHome(container: HTMLElement): Promise<void> {
  renderNavbar(container);

  const main = document.createElement('main');
  main.className = 'main-content';
  main.innerHTML = '<div class="loading">Loading...</div>';
  container.appendChild(main);

  const workspaceExists = await checkWorkspaceExists();

  if (!workspaceExists) {
    main.innerHTML = `
      <section class="onboarding">
        <h2>Welcome to Lattix</h2>
        <p>No Lattix workspace found in your OneDrive. Get started by installing Lattix on your first machine:</p>
        <pre class="code-block">npx -y lattix run</pre>
        <p>This will create the Lattix workspace in your OneDrive and start watching for tasks.</p>
        <p class="onboarding-hint">💡 Make sure you signed in with the same Microsoft account used by your machines' OneDrive.</p>
      </section>
    `;
    return;
  }

  // Load data in parallel
  const [taskResult, nodes] = await Promise.all([
    listTaskFiles(),
    discoverNodes(),
  ]);

  // Read task file contents for recent tasks
  const recentTasks: { task: TaskFile; lastModified: string }[] = [];
  for (const item of taskResult.items.slice(0, 10)) {
    try {
      const task = await readFileContent<TaskFile>(item.id);
      recentTasks.push({ task, lastModified: item.lastModifiedDateTime });
    } catch {
      // skip unreadable tasks
    }
  }

  main.innerHTML = '';

  // Submit form
  const submitSection = document.createElement('section');
  submitSection.className = 'submit-section';
  submitSection.innerHTML = `
    <h2>Submit a Task</h2>
    <form id="submit-form" class="submit-form">
      <input type="text" id="task-title" placeholder="Title (optional)" maxlength="100" class="form-input" />
      <textarea id="task-prompt" placeholder="What should the agents do?" maxlength="10000" class="form-textarea" required rows="3"></textarea>
      <button type="submit" class="btn btn-primary">Submit Task</button>
    </form>
  `;
  main.appendChild(submitSection);

  submitSection.querySelector('#submit-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    const promptInput = document.getElementById('task-prompt') as HTMLTextAreaElement;
    const btn = submitSection.querySelector('button[type="submit"]') as HTMLButtonElement;

    try {
      btn.disabled = true;
      btn.textContent = 'Submitting...';
      await submitTask(titleInput.value || undefined, promptInput.value);
      titleInput.value = '';
      promptInput.value = '';
      showToast('Task submitted successfully!', 'info');
    } catch (err) {
      showToast(`Failed to submit: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Task';
    }
  });

  // Nodes section
  const nodesSection = document.createElement('section');
  nodesSection.className = 'nodes-section';
  if (nodes.length > 0) {
    nodesSection.innerHTML = `<h2>Nodes (${nodes.length})</h2>`;
    const grid = document.createElement('div');
    grid.className = 'node-grid';
    for (const node of nodes) {
      const card = document.createElement('div');
      card.className = 'node-card';
      card.innerHTML = `
        <div class="node-hostname">${node.hostname}</div>
        <div class="node-meta">
          <span>${node.taskCount} task${node.taskCount !== 1 ? 's' : ''}</span>
          <span>Last active: ${formatDate(node.lastActive)}</span>
        </div>
      `;
      grid.appendChild(card);
    }
    nodesSection.appendChild(grid);
  } else {
    nodesSection.innerHTML = `
      <h2>Nodes</h2>
      <p class="empty-state">No nodes have executed tasks yet. Run <code>npx -y lattix run</code> on a machine to enroll it.</p>
    `;
  }
  main.appendChild(nodesSection);

  // Recent tasks
  const tasksSection = document.createElement('section');
  tasksSection.className = 'tasks-section';
  if (recentTasks.length > 0) {
    tasksSection.innerHTML = `
      <h2>Recent Tasks</h2>
      <div class="task-list">
        ${recentTasks
          .map(
            ({ task, lastModified }) => `
          <a href="#/tasks/${task.id}" class="task-item">
            <div class="task-title">${task.title || task.id}</div>
            <div class="task-meta">
              <span>${formatDate(task.createdAt || lastModified)}</span>
              ${task.createdBy ? `<span>by ${task.createdBy}</span>` : ''}
            </div>
          </a>
        `,
          )
          .join('')}
      </div>
      <a href="#/tasks" class="btn btn-sm view-all-link">View all tasks →</a>
    `;
  } else {
    tasksSection.innerHTML = `
      <h2>Tasks</h2>
      <p class="empty-state">No tasks yet. Use the form above to submit your first task.</p>
    `;
  }
  main.appendChild(tasksSection);
}
