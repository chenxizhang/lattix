import { renderNavbar } from './navbar';
import { listTaskFiles, readFileContent } from '../graph';
import { formatDate } from '../utils';
import type { TaskFile, DriveItem } from '../types';

export async function renderTaskList(container: HTMLElement): Promise<void> {
  renderNavbar(container);

  const main = document.createElement('main');
  main.className = 'main-content';
  main.innerHTML = '<div class="loading">Loading tasks...</div>';
  container.appendChild(main);

  let nextLink: string | undefined;
  const allItems: { task: TaskFile; driveItem: DriveItem }[] = [];

  async function loadPage(link?: string): Promise<void> {
    const result = await listTaskFiles(link);
    nextLink = result.nextLink;

    for (const item of result.items) {
      try {
        const task = await readFileContent<TaskFile>(item.id);
        allItems.push({ task, driveItem: item });
      } catch {
        // skip unreadable
      }
    }

    renderList();
  }

  function renderList(): void {
    main.innerHTML = '';

    const header = document.createElement('h2');
    header.textContent = `Tasks (${allItems.length}${nextLink ? '+' : ''})`;
    main.appendChild(header);

    if (allItems.length === 0) {
      main.innerHTML += '<p class="empty-state">No tasks found.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'task-list';

    for (const { task, driveItem } of allItems) {
      const item = document.createElement('a');
      item.href = `#/tasks/${task.id}`;
      item.className = 'task-item';
      item.innerHTML = `
        <div class="task-title">${task.title || task.id}</div>
        <div class="task-meta">
          <span>${formatDate(task.createdAt || driveItem.lastModifiedDateTime)}</span>
          ${task.createdBy ? `<span>by ${task.createdBy}</span>` : ''}
        </div>
      `;
      list.appendChild(item);
    }

    main.appendChild(list);

    if (nextLink) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'btn btn-sm load-more-btn';
      loadMoreBtn.textContent = 'Load more';
      loadMoreBtn.addEventListener('click', async () => {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
        await loadPage(nextLink);
      });
      main.appendChild(loadMoreBtn);
    }
  }

  await loadPage();
}
