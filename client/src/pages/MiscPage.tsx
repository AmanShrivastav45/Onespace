// src/pages/MiscPage.tsx
import { ResourceBoard } from '../components/board/ResourceBoard';
import { useData } from '../context/DataContext';

export default function MiscPage() {
  const { miscTasks, miscController } = useData();

  return (
    <ResourceBoard
      items={miscTasks}
      controller={miscController}
      showKey={false}
      resourceLabel="Task"
      emptyHint="No tasks yet — create your first miscellaneous task to get started."
    />
  );
}
