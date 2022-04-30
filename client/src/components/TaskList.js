import React from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Task from "./Task";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

function TaskList(props) {
  const editTask = (taskId, task) => {
    props.setTasks(
      props.tasks.map((item) => {
        return item.id === taskId ? task : item;
      })
    );
  };

  function onDragEnd(result) {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const tasks = reorder(
      props.tasks,
      result.source.index,
      result.destination.index
    );
    props.setTasks(tasks);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="taskList">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {props.tasks.map((task, index) => {
              return (
                <Task
                  key={task.id}
                  task={task}
                  index={index}
                  deleteTask={props.deleteTask}
                  editTask={editTask}
                ></Task>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default TaskList;
