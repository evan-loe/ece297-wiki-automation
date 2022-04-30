import React from "react";
import { Draggable } from "react-beautiful-dnd";
import styles from "../assets/task.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

function Task(props) {
  function renderTask({
    taskName,
    taskDescription,
    person,
    status,
    dueDate,
    completeDate,
    comments,
  }) {
    return (
      <div className={styles.taskTextContainer}>
        <div>
          <div className={styles.taskName}>
            <input
              type="text"
              value={taskName}
              onChange={(event) => {
                props.editTask(props.task.id, {
                  ...props.task,
                  taskName: event.target.value,
                });
              }}
              style={{ width: `min(${taskName.length + 1}ch, 97%)` }}
            ></input>
          </div>
          <div className={styles.taskDescription}>
            <textarea
              rows="4"
              type="text"
              value={taskDescription}
              onChange={(event) => {
                props.editTask(props.task.id, {
                  ...props.task,
                  taskDescription: event.target.value,
                });
              }}
            ></textarea>
          </div>
        </div>
        <div className={styles.taskTextStats}>
          <div>
            <strong>Person:</strong>
            <input
              type="text"
              value={person}
              onChange={(event) => {
                props.editTask(props.task.id, {
                  ...props.task,
                  person: event.target.value,
                });
              }}
              style={{ width: `min(${person.length + 2}ch, 97%)` }}
            ></input>
          </div>
          <div>
            <strong>Status:</strong>
            <input
              type="text"
              value={status}
              onChange={(event) => {
                props.editTask(props.task.id, {
                  ...props.task,
                  status: event.target.value,
                });
              }}
              style={{ width: `min(${status.length + 2}ch, 97%)` }}
            ></input>
          </div>
        </div>
        <div className={styles.taskTextStats}>
          <div>
            <strong>Due: </strong>
            <input
              type="text"
              value={dueDate}
              onChange={(event) => {
                props.editTask(props.task.id, {
                  ...props.task,
                  dueDate: event.target.value,
                });
              }}
              style={{ width: `min(${dueDate.length + 2}ch, 97%)` }}
            ></input>
          </div>
          <div>
            <strong>Completed: </strong>
            <input
              type="text"
              value={completeDate}
              onChange={(event) => {
                props.editTask(props.task.id, {
                  ...props.task,
                  completeDate: event.target.value,
                });
              }}
              style={{ width: `min(${completeDate.length + 2}ch, 97%)` }}
            ></input>
          </div>
        </div>
        <div className={styles.taskTextStats}>
          <div>
            <strong>Comments: </strong>
            <input
              type="text"
              value={comments}
              onChange={(event) => {
                props.editTask(props.task.id, {
                  ...props.task,
                  comments: event.target.value,
                });
              }}
              style={{ width: `min(${comments.length + 2}ch, 97%)` }}
            ></input>
          </div>
          <div></div>
        </div>
      </div>
    );
  }

  const handleClick = (event) => {
    props.deleteTask(event.currentTarget.getAttribute("trashid"));
  };

  return (
    <Draggable draggableId={props.task.id} index={props.index}>
      {(provided) => (
        <div
          className={styles.taskItem}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <button trashid={props.task.id} className={styles.deleteTask} onClick={handleClick}>
            <FontAwesomeIcon icon={faTrash} trashid={props.task.id} />
          </button>
          {renderTask(props.task)}
        </div>
      )}
    </Draggable>
  );
}

export default Task;
