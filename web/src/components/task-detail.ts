import { renderNavbar } from './navbar';
import { listTaskFiles, readFileContent, listTaskResults } from '../graph';
import { formatDate, formatDuration, hostnameFromResultFile } from '../utils';
import type { TaskFile, ResultFile, DriveItem } from '../types';

export async function renderTaskDetail(
  container: HTMLElement,
  taskId: string,
): Promise<void> {
  renderNavbar(container);

  const main = document.createElement('main');
  main.className = 'main-content';
  main.innerHTML = '<div class="loading">Loading task...</div>';
  container.appendChild(main);

  // Find the task file by listing tasks and matching ID
  let task: TaskFile | null = null;

  try {
    const result = await listTaskFiles();
    for (const item of result.items) {
      if (item.name === `${taskId}.json`) {
        task = await readFileContent<TaskFile>(item.id);
        break;
      }
    }
  } catch {
    // fallback: try reading by filename
  }

  if (!task) {
    main.innerHTML = `
      <h2>Task Not Found</h2>
      <p class="empty-state">Could not find task <code>${taskId}</code>.</p>
      <a href="#/tasks" class="btn btn-sm">← Back to tasks</a>
    `;
    return;
  }

  // Load results
  const resultItems = await listTaskResults(taskId);
  const results: { hostname: string; result: ResultFile; driveItem: DriveItem }[] = [];

  for (const item of resultItems) {
    const hostname = hostnameFromResultFile(item.name);
    if (hostname) {
      try {
        const result = await readFileContent<ResultFile>(item.id);
        results.push({ hostname, result, driveItem: item });
      } catch {
        // skip unreadable
      }
    }
  }

  main.innerHTML = `
    <a href="#/tasks" class="btn btn-sm back-link">← Back</a>
    <h2>${task.title || task.id}</h2>
    <div class="task-detail-meta">
      <div><strong>ID:</strong> ${task.id}</div>
      ${task.createdAt ? `<div><strong>Created:</strong> ${formatDate(task.createdAt)}</div>` : ''}
      ${task.createdBy ? `<div><strong>Created by:</strong> ${task.createdBy}</div>` : ''}
    </div>
    <div class="task-prompt-display">
      <h3>Prompt</h3>
      <pre class="code-block">${task.prompt}</pre>
    </div>
    <h3>Results (${results.length} machine${results.length !== 1 ? 's' : ''})</h3>
  `;

  if (results.length === 0) {
    main.innerHTML += '<p class="empty-state">No results yet. Machines may still be processing this task.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'results-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Machine</th>
        <th>Status</th>
        <th>Exit Code</th>
        <th>Duration</th>
        <th>Completed</th>
      </tr>
    </thead>
    <tbody>
      ${results
        .map(
          ({ hostname, result }) => `
        <tr>
          <td>${hostname}</td>
          <td><span class="status-badge status-badge--${result.status}">${result.status}</span></td>
          <td>${result.exitCode}</td>
          <td>${formatDuration(result.startedAt, result.completedAt)}</td>
          <td>${formatDate(result.completedAt)}</td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  `;
  main.appendChild(table);
}
