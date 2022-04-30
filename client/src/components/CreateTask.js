import React, { useState } from "react";
import styles from "../assets/createTask.module.css";

const initial = {
  taskName: "",
  taskDescription: "",
  person: "",
  status: "",
  dueDate: "",
  completeDate: "",
  comments: "",
};

function CreateTask(props) {
  const [task, setTask] = useState(initial);

  const handleClick = () => {
    props.newTask(task);
    setTask(initial);
  };

  return (
    <div className={styles.newTaskContainer}>
      <div>
        <div className={styles.inputContainer}>
          <label>Task Name</label>
          <input
            className="inputField"
            type="text"
            value={task.taskName}
            onChange={(e) => setTask({ ...task, taskName: e.target.value })}
          />
        </div>
        <div className={styles.inputContainer}>
          <label>Person</label>
          <input
            className="inputField"
            type="text"
            value={task.person}
            onChange={(e) => setTask({ ...task, person: e.target.value })}
          />
        </div>
        <div className={styles.inputContainer}>
          <label>Status</label>
          <input
            className="inputField"
            type="text"
            value={task.status}
            onChange={(e) => setTask({ ...task, status: e.target.value })}
          />
        </div>
        <div className={styles.inputContainer}>
          <label>Due Date</label>
          <input
            className="inputField"
            type="text"
            value={task.dueDate}
            onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
          />
        </div>
        <div className={styles.inputContainer}>
          <label>Completed Date</label>
          <input
            className="inputField"
            type="text"
            value={task.completeDate}
            onChange={(e) => setTask({ ...task, completeDate: e.target.value })}
          />
        </div>
        <div className={styles.inputContainer}>
          <label>Comments</label>
          <input
            className="inputField"
            type="text"
            value={task.comments}
            onChange={(e) => setTask({ ...task, comments: e.target.value })}
          />
        </div>
      </div>
      <div>
        <div className={`${styles.inputContainer} ${styles.descriptionContainer}`}>
          <label>Task Description</label>
          <textarea
            className="inputField"
            name="description"
            value={task.taskDescription}
            onChange={(e) => setTask({ ...task, taskDescription: e.target.value })}
          />
        </div>
      </div>
      <div>
        <div className={styles.inputContainer}>
          <button className="btn" onClick={handleClick}>
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateTask;
